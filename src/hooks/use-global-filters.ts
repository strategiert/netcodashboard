"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback } from "react";

export type Granularity = "daily" | "weekly" | "monthly";

const DEFAULT_FROM = "2013-01-01";

function today() { return new Date().toISOString().slice(0, 10); }

export function useGlobalFilters() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const dateFrom    = searchParams.get("from") ?? DEFAULT_FROM;
  const dateTo      = searchParams.get("to") ?? today();
  const granularity = (searchParams.get("granularity") as Granularity) ?? "weekly";

  const setFilters = useCallback(
    (updates: { from?: string; to?: string; granularity?: Granularity }) => {
      const params = new URLSearchParams(searchParams.toString());
      if (updates.from !== undefined)        params.set("from", updates.from);
      if (updates.to !== undefined)          params.set("to", updates.to);
      if (updates.granularity !== undefined) params.set("granularity", updates.granularity);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [searchParams, router, pathname],
  );

  const setDateRange = useCallback(
    (from: string, to: string) => setFilters({ from, to }),
    [setFilters],
  );

  const setGranularity = useCallback(
    (g: Granularity) => setFilters({ granularity: g }),
    [setFilters],
  );

  return { dateFrom, dateTo, granularity, setDateRange, setGranularity, setFilters };
}
