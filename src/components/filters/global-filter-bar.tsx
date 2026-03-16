"use client";

import { useGlobalFilters } from "@/hooks/use-global-filters";
import { DateRangePicker } from "./date-range-picker";
import { GranularityToggle } from "./granularity-toggle";

export function GlobalFilterBar() {
  const { dateFrom, dateTo, granularity, setDateRange, setGranularity } = useGlobalFilters();

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <GranularityToggle value={granularity} onChange={setGranularity} />
      <DateRangePicker from={dateFrom} to={dateTo} onChange={setDateRange} />
    </div>
  );
}
