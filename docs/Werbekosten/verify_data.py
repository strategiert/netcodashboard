# -*- coding: utf-8 -*-
"""
Werbekosten-Analyse: Korrekte Berechnung aus Quelldaten
Erstellt: 16.02.2026
"""
import csv
import os
import re
from collections import defaultdict

BASE_DIR = r"C:\Users\karent\Documents\Software\netcodashboard\docs\Werbekosten"

FILES = {
    ("NetCo", 2023): "Werbekosten NetCo 2023.csv",
    ("NetCo", 2024): "Werbekosten NetCo 2024.csv",
    ("NetCo", 2025): "Werbekosten NetCo 2025.csv",
    ("MV", 2023): "Werbekosten MV 2023.csv",
    ("MV", 2024): "Werbekosten MV 2024.csv",
    ("MV", 2025): "Werbekosten MV 2025.csv",
}

# Kategorie-Zuordnung nach Kreditor-Name
KREDITOR_CATEGORY = {
    "Google Ireland Limited": "Google Ads",
    "Microsoft Ireland Operations Ltd.": "Microsoft Ads",
    "Linkedin Ireland Unlimited": "LinkedIn",
    "Meta Platforms Ireland Limited": "Meta/Social",
    "Fiverr International Ltd.": "Fiverr/Freelancer",
    "WIRmachenDRUCK GmbH": "Drucksachen",
    "ReklameWerkstatt": "Werbemittel",
    "CleverReach GmbH & Co. KG": "Tools (Email)",
    "cloud4you AG": "Tools (CRM)",
    "Dropbox International Unlimited Company": "Tools",
    "Tilo Sichler": "Video/Content",
    "Loft Film GmbH": "Video/Content",
    "Oliver Pohl": "Content/PR",
    "ProPress Verlag": "Messen/Presse",
    "Deutsche Sicherheits-Akademie GmbH": "Messen/Events",
    "United News Network GmbH": "PR/Pressebox",
    "AD20 Internet GmbH": "SEO/Keywords",
    "legal.solutions GmbH": "SEO",
    "Harzdruckerei GmbH": "Drucksachen",
    "Ekramul Hassan Asif": "Freelancer",
    "Dorint Hotel an der Messe": "Messen/Events",
    "nH COLLECTION HOTELS": "Messen/Events",
    "AMERON": "Messen/Events",
    "Trend Punkt Werbung": "Werbemittel",
    "XYBERDYN Kreativagentur": "Werbemittel",
    "Stepstone Deutschland GmbH": "Sonstiges",
    "Nessie Research Lab": "Sonstiges",
    "WebhostOne GmbH": "Tools",
    "DVS Media GmbH": "Content/PR",
    "Pensaki GmbH": "Werbemittel",
    "Plato Group GmbH": "Werbemittel",
    "Quedlinga Marketing": "Werbemittel",
    "Glocal Marketing LLC": "Google Ads Management",
    "Mouja Malibari": "Tools (Tracking)",
    "Carlo Siebert Onlinemarketing": "SEO",
    "PSG Sozialwerk GmbH": "Messen/Events",
    "GodschanFotografie": "Video/Content",
    "Concept Beschriftungen": "Werbemittel",
    "IPS Karton.eu": "Werbemittel",
    "Lothar M\u00fcller Transporte": "Messen/Events",
    "Kontrapunkt GmbH": "Messen/Events",
    "ACOD Automotive": "Messen/Events",
    "Dr. Barbara Stumpp": "Content/PR",
    "Wegweiser Media": "Messen/Events",
    "FDV Veranstaltungstechnik": "Messen/Events",
    "LODAX": "Messen/Events",
    "eleven teamsports": "Werbemittel",
    "SportScheck": "Werbemittel",
    "work4media": "Content/PR",
    "Le Connecteur": "Sonstiges",
    "Manuela Guiliana Xillovich": "Content/PR",
    "Stadt Blankenburg": "Messen/Events",
    "Presse Verlagsgesellschaft": "Content/PR",
    "Prof. Dr. Claudius Ohder": "Messen/Events",
    "Verlag Deutsche Polizeiliteratur": "Content/PR",
    "Microvista GmbH": "IC (intern)",
    "NetCo Professional Services GmbH": "IC (intern)",
    "Timeride GmbH": "Messen/Events",
}


def parse_amount(val):
    """Parse German-format amount like '1,234.56 EUR' or '1.234,56 EUR'"""
    if not val or val.strip() == "":
        return 0.0
    val = val.strip().replace(" EUR", "").replace("EUR", "").strip()
    if not val:
        return 0.0
    # Format is "1,234.56" (US format with comma as thousands separator)
    val = val.replace(",", "")
    try:
        return float(val)
    except ValueError:
        return 0.0


def get_month(date_str):
    """Extract month number from DD.MM.YYYY format"""
    parts = date_str.strip().split(".")
    if len(parts) >= 2:
        return int(parts[1])
    return 0


def categorize(kreditor_name, positionstext, sachkonto):
    """Determine category based on kreditor and context"""
    if sachkonto and sachkonto.strip() == "460100":
        return "Messekosten"

    # Check kreditor name against known mappings
    for key, cat in KREDITOR_CATEGORY.items():
        if key.lower() in kreditor_name.lower():
            return cat

    # Check positionstext for clues
    pt = positionstext.lower()
    if "google" in pt and ("ads" in pt or "bsk" in pt or "bc " in pt or "marketing" in pt):
        return "Google Ads"
    if "linkedin" in pt or "sales navigator" in pt or "sales navi" in pt:
        return "LinkedIn"
    if "pressebox" in pt or "pressbox" in pt:
        return "PR/Pressebox"
    if "se ranking" in pt:
        return "Tools (SEO)"
    if "keyword" in pt:
        return "SEO/Keywords"
    if "messe" in pt or "expo" in pt or "konferenz" in pt or "kongress" in pt or "bodycam-konferenz" in pt:
        return "Messen/Events"
    if "clever" in pt or "essential tarif" in pt:
        return "Tools (Email)"
    if "crm" in pt or "cloud4" in pt:
        return "Tools (CRM)"
    if "dropbox" in pt:
        return "Tools"
    if "visitenkarten" in pt or "flyer" in pt or "brosch" in pt or "faltblatt" in pt:
        return "Drucksachen"
    if "video" in pt or "film" in pt or "animation" in pt or "schnitt" in pt:
        return "Video/Content"
    if "microsoft" in pt or "ms/google" in pt:
        return "Microsoft Ads"
    if "meta" in pt or "instagram" in pt or "facebook" in pt:
        return "Meta/Social"
    if "fc starter" in pt:
        return "Tools"
    if "bouwtv" in pt or "bouwt" in pt or "bouwtafel" in pt:
        return "IC (intern)"
    if "adseed" in pt:
        return "Google Ads Management"
    if "server tracking" in pt or "google ads manag" in pt:
        return "Google Ads Management"
    if "content" in pt and "marketing" in pt:
        return "Content/PR"

    return "Sonstiges"


def process_file(filepath, company, year):
    """Process a single CSV file and return list of entries"""
    entries = []
    with open(filepath, "r", encoding="utf-8", errors="replace") as f:
        reader = csv.reader(f)
        for row in reader:
            if len(row) < 12:
                continue
            sachkonto = row[1].strip() if len(row) > 1 else ""
            # Skip header and non-data rows
            if sachkonto not in ("460100", "461000"):
                continue

            datum = row[3].strip() if len(row) > 3 else ""
            positionstext = row[6].strip() if len(row) > 6 else ""
            kreditor_nr = row[7].strip() if len(row) > 7 else ""
            kreditor_name = row[8].strip() if len(row) > 8 else ""
            belegart = row[9].strip() if len(row) > 9 else ""
            soll_str = row[10].strip() if len(row) > 10 else ""
            haben_str = row[11].strip() if len(row) > 11 else ""

            # Skip Saldovortrag entries
            if "Saldovortrag" in belegart:
                continue

            soll = parse_amount(soll_str)
            haben = parse_amount(haben_str)
            month = get_month(datum)
            category = categorize(kreditor_name, positionstext, sachkonto)
            net = soll - haben

            entries.append({
                "company": company,
                "year": year,
                "month": month,
                "date": datum,
                "sachkonto": sachkonto,
                "positionstext": positionstext,
                "kreditor": kreditor_name,
                "belegart": belegart,
                "soll": soll,
                "haben": haben,
                "net": net,
                "category": category,
            })
    return entries


def main():
    all_entries = []

    for (company, year), filename in FILES.items():
        filepath = os.path.join(BASE_DIR, filename)
        entries = process_file(filepath, company, year)
        all_entries.append((company, year, entries))
        total_soll = sum(e["soll"] for e in entries)
        total_haben = sum(e["haben"] for e in entries)
        net = total_soll - total_haben
        print(f"\n{'='*60}")
        print(f"{company} {year}: Soll={total_soll:,.2f} | Haben={total_haben:,.2f} | Netto={net:,.2f}")

    # Aggregate all entries
    flat = []
    for company, year, entries in all_entries:
        flat.extend(entries)

    print(f"\n{'='*60}")
    print("JAHRESUEBERSICHT (Netto = Soll - Haben, ohne Saldovortrag)")
    print(f"{'='*60}")

    yearly = defaultdict(lambda: {"soll": 0, "haben": 0, "net": 0, "count": 0})
    for e in flat:
        key = (e["company"], e["year"])
        yearly[key]["soll"] += e["soll"]
        yearly[key]["haben"] += e["haben"]
        yearly[key]["net"] += e["net"]
        yearly[key]["count"] += 1

    for key in sorted(yearly.keys()):
        d = yearly[key]
        print(f"  {key[0]:8s} {key[1]}: Netto = {d['net']:>12,.2f} EUR ({d['count']} Buchungen)")

    # Grand totals per year
    print(f"\n{'='*60}")
    print("GESAMT PRO JAHR")
    for year in [2023, 2024, 2025]:
        total = sum(yearly[(c, year)]["net"] for c in ["NetCo", "MV"] if (c, year) in yearly)
        print(f"  {year}: {total:>12,.2f} EUR")

    # Monthly breakdown
    print(f"\n{'='*60}")
    print("MONATLICHE UEBERSICHT")
    print(f"{'='*60}")
    monthly = defaultdict(float)
    for e in flat:
        monthly[(e["company"], e["year"], e["month"])] += e["net"]

    for company in ["NetCo", "MV"]:
        print(f"\n--- {company} ---")
        for year in [2023, 2024, 2025]:
            print(f"  {year}:")
            year_total = 0
            for month in range(1, 13):
                val = monthly.get((company, year, month), 0)
                year_total += val
                mname = ["", "Jan", "Feb", "Mar", "Apr", "Mai", "Jun",
                         "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"][month]
                print(f"    {mname}: {val:>10,.2f} EUR")
            print(f"    GESAMT: {year_total:>10,.2f} EUR")

    # Category breakdown
    print(f"\n{'='*60}")
    print("KATEGORIEN (Gesamt 2023-2025)")
    print(f"{'='*60}")
    cat_totals = defaultdict(float)
    cat_by_company = defaultdict(float)
    for e in flat:
        cat_totals[e["category"]] += e["net"]
        cat_by_company[(e["company"], e["category"])] += e["net"]

    grand_total = sum(cat_totals.values())
    for cat, total in sorted(cat_totals.items(), key=lambda x: -x[1]):
        pct = (total / grand_total * 100) if grand_total else 0
        print(f"  {cat:25s}: {total:>12,.2f} EUR ({pct:5.1f}%)")
    print(f"  {'GESAMT':25s}: {grand_total:>12,.2f} EUR")

    # Category by company and year
    print(f"\n{'='*60}")
    print("KATEGORIEN NACH UNTERNEHMEN UND JAHR")
    print(f"{'='*60}")
    cat_detail = defaultdict(float)
    for e in flat:
        cat_detail[(e["company"], e["year"], e["category"])] += e["net"]

    for company in ["NetCo", "MV"]:
        print(f"\n--- {company} ---")
        for year in [2023, 2024, 2025]:
            print(f"  {year}:")
            year_cats = {k[2]: v for k, v in cat_detail.items()
                         if k[0] == company and k[1] == year}
            for cat, val in sorted(year_cats.items(), key=lambda x: -x[1]):
                if abs(val) > 0.01:
                    print(f"    {cat:25s}: {val:>10,.2f} EUR")
            year_total = sum(year_cats.values())
            print(f"    {'GESAMT':25s}: {year_total:>10,.2f} EUR")

    # YoY Growth
    print(f"\n{'='*60}")
    print("YoY WACHSTUM")
    print(f"{'='*60}")
    for company in ["NetCo", "MV", "Gesamt"]:
        vals = {}
        for year in [2023, 2024, 2025]:
            if company == "Gesamt":
                vals[year] = sum(yearly[(c, year)]["net"] for c in ["NetCo", "MV"] if (c, year) in yearly)
            else:
                vals[year] = yearly.get((company, year), {}).get("net", 0)
        for y1, y2 in [(2023, 2024), (2024, 2025)]:
            if vals[y1] != 0:
                growth = (vals[y2] - vals[y1]) / vals[y1] * 100
                print(f"  {company:8s} {y1}->{y2}: {growth:+.1f}%")

    # Top Kreditoren
    print(f"\n{'='*60}")
    print("TOP 15 KREDITOREN")
    print(f"{'='*60}")
    kred_totals = defaultdict(float)
    kred_counts = defaultdict(int)
    for e in flat:
        kred_totals[e["kreditor"]] += e["net"]
        kred_counts[e["kreditor"]] += 1

    for kred, total in sorted(kred_totals.items(), key=lambda x: -x[1])[:15]:
        print(f"  {kred:45s}: {total:>10,.2f} EUR ({kred_counts[kred]} Buchungen)")


if __name__ == "__main__":
    main()
