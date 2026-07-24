"""Chronos-2-Forecast + 7-Tage-Backtest/Anomalie-Erkennung.
Liest data/input.json (siehe pull.mjs), schreibt data/output.json im Ingest-Format
von convex/forecast.ts (POST /forecast/ingest via push.mjs).
Läuft mit forecast/.venv/Scripts/python.exe. Pfade sind relativ zum Skript-Verzeichnis
aufgelöst (nicht zum CWD) — läuft also unabhängig vom Aufrufort (siehe forecast-night.ps1).
"""
import json
import sys
import time
from pathlib import Path

import numpy as np
import pandas as pd
from chronos import Chronos2Pipeline

SCRIPT_DIR = Path(__file__).resolve().parent
IN_FILE = SCRIPT_DIR / "data" / "input.json"
OUT_FILE = SCRIPT_DIR / "data" / "output.json"

METRICS = ["sessions", "adSpend", "adConversions"]
FORECAST_HORIZON = 14
BACKTEST_HORIZON = 7
QUANTILES = [0.1, 0.5, 0.9]


def build_daily_series(points, metric):
    """points: Liste [{date, value}]. Reindexed auf tägliche Frequenz zwischen
    erstem und letztem Datum. Fehlende Tage:
    - sessions: linear interpoliert (GA4-Lücken sind Messausfälle, keine echten
      Nullen — eine Null würde die Serie künstlich einbrechen lassen).
    - adSpend/adConversions: mit 0 aufgefüllt (kein Kampagnentag = korrekt 0,
      keine Messlücke).
    Rückgabe: pandas.Series mit DatetimeIndex, oder None wenn zu kurz/leer.
    """
    if not points:
        return None
    df = pd.DataFrame(points)
    df["date"] = pd.to_datetime(df["date"])
    df = df.sort_values("date").drop_duplicates("date", keep="last")
    s = df.set_index("date")["value"].astype(float)
    full_index = pd.date_range(s.index.min(), s.index.max(), freq="D")
    s = s.reindex(full_index)
    if metric == "sessions":
        s = s.interpolate(method="linear", limit_direction="both")
    else:
        s = s.fillna(0.0)
    return s


def clamp_nonneg(x):
    return float(x) if x > 0 else 0.0


def main():
    t_start = time.time()
    if not IN_FILE.exists():
        print(f"FEHLER: {IN_FILE} nicht gefunden. Erst pull.mjs laufen lassen.")
        sys.exit(1)

    payload = json.loads(IN_FILE.read_text(encoding="utf-8"))
    brands = payload.get("brands", [])

    skipped = []
    # item_key -> (slug, metric, full_series, backtest_series (ohne letzte 7 Tage))
    items = {}

    for brand in brands:
        slug = brand["slug"]
        series_map = brand.get("series", {})
        for metric in METRICS:
            points = series_map.get(metric)
            item_key = f"{slug}|{metric}"
            if not points:
                continue  # von pull.mjs schon als zu kurz aussortiert
            s = build_daily_series(points, metric)
            if s is None or len(s) < 14:
                skipped.append({"brandSlug": slug, "metric": metric, "reason": "too_short_after_reindex"})
                continue
            if (s == 0).all():
                skipped.append({"brandSlug": slug, "metric": metric, "reason": "constant_zero"})
                continue
            if len(s) <= BACKTEST_HORIZON + 10:
                # zu wenig Kontext für einen sinnvollen Backtest übrig
                skipped.append({"brandSlug": slug, "metric": metric, "reason": "too_short_for_backtest"})
                # Forecast auf voller Serie trotzdem sinnvoll -> nicht komplett skippen,
                # nur Backtest/Anomalien auslassen.
                items[item_key] = {"slug": slug, "metric": metric, "full": s, "backtest_ctx": None, "backtest_actual": None}
                continue
            backtest_ctx = s.iloc[:-BACKTEST_HORIZON]
            backtest_actual = s.iloc[-BACKTEST_HORIZON:]
            items[item_key] = {"slug": slug, "metric": metric, "full": s, "backtest_ctx": backtest_ctx, "backtest_actual": backtest_actual}

    if not items:
        print("Keine verwertbaren Serien — output.json wird mit leeren Listen geschrieben.")
        OUT_FILE.parent.mkdir(parents=True, exist_ok=True)
        OUT_FILE.write_text(json.dumps({"generation": int(time.time() * 1000), "rows": [], "anomalies": [], "skipped": skipped}, indent=2))
        return

    print(f"Lade Chronos-2 Pipeline …")
    t_load = time.time()
    pipeline = Chronos2Pipeline.from_pretrained("amazon/chronos-2", device_map="cpu")
    print(f"  Pipeline geladen in {time.time() - t_load:.1f}s")

    # ── Batch 1: Voll-Prognose (14 Tage) ────────────────────────────────────
    forecast_frames = []
    for key, it in items.items():
        s = it["full"]
        forecast_frames.append(pd.DataFrame({"item_id": key, "timestamp": s.index, "target": s.values}))
    forecast_df = pd.concat(forecast_frames, ignore_index=True)
    print(f"Forecast-Batch: {len(items)} Serien, {len(forecast_df)} Datenpunkte.")
    t_pred = time.time()
    forecast_out = pipeline.predict_df(forecast_df, prediction_length=FORECAST_HORIZON, quantile_levels=QUANTILES)
    print(f"  predict_df (forecast) in {time.time() - t_pred:.1f}s")

    # ── Batch 2: Backtest (Kontext ohne letzte 7 Tage, 7-Tage-Prognose) ─────
    backtest_items = {k: v for k, v in items.items() if v["backtest_ctx"] is not None}
    backtest_out = None
    if backtest_items:
        backtest_frames = []
        for key, it in backtest_items.items():
            s = it["backtest_ctx"]
            backtest_frames.append(pd.DataFrame({"item_id": key, "timestamp": s.index, "target": s.values}))
        backtest_df = pd.concat(backtest_frames, ignore_index=True)
        print(f"Backtest-Batch: {len(backtest_items)} Serien, {len(backtest_df)} Datenpunkte.")
        t_bt = time.time()
        backtest_out = pipeline.predict_df(backtest_df, prediction_length=BACKTEST_HORIZON, quantile_levels=QUANTILES)
        print(f"  predict_df (backtest) in {time.time() - t_bt:.1f}s")

    # ── Forecast-Rows bauen ──────────────────────────────────────────────────
    rows = []
    for _, r in forecast_out.iterrows():
        slug, metric = r["item_id"].split("|", 1)
        rows.append({
            "brandSlug": slug,
            "metric": metric,
            "date": pd.Timestamp(r["timestamp"]).strftime("%Y-%m-%d"),
            "p10": clamp_nonneg(r["0.1"]),
            "p50": clamp_nonneg(r["0.5"]),
            "p90": clamp_nonneg(r["0.9"]),
        })

    # ── Anomalien aus dem Backtest ───────────────────────────────────────────
    anomalies = []
    if backtest_out is not None:
        for key, it in backtest_items.items():
            actual_s = it["backtest_actual"]
            sub = backtest_out[backtest_out["item_id"] == key]
            for _, r in sub.iterrows():
                date_str = pd.Timestamp(r["timestamp"]).strftime("%Y-%m-%d")
                ts = pd.Timestamp(r["timestamp"])
                if ts not in actual_s.index:
                    continue
                actual = float(actual_s.loc[ts])
                p10 = clamp_nonneg(r["0.1"])
                p90 = clamp_nonneg(r["0.9"])
                if actual < p10 or actual > p90:
                    band = p90 - p10
                    if actual < p10 - band * 0.5 or actual > p90 + band * 0.5:
                        severity = "critical"
                    else:
                        severity = "warn"
                    anomalies.append({
                        "brandSlug": it["slug"],
                        "metric": it["metric"],
                        "date": date_str,
                        "actual": actual,
                        "p10": p10,
                        "p90": p90,
                        "severity": severity,
                    })

    generation = int(time.time() * 1000)
    out = {"generation": generation, "rows": rows, "anomalies": anomalies, "skipped": skipped}
    OUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    OUT_FILE.write_text(json.dumps(out, indent=2), encoding="utf-8")

    elapsed = time.time() - t_start
    print(f"Fertig: {len(items)} Serien verarbeitet, {len(rows)} Forecast-Rows, {len(anomalies)} Anomalien, {len(skipped)} übersprungen.")
    print(f"Gesamtlaufzeit run.py: {elapsed:.1f}s")
    print(f"Geschrieben: {OUT_FILE}")


if __name__ == "__main__":
    main()
