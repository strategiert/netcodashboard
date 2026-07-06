export function shouldIncludeInPerformanceSnapshot(channelType: string | undefined | null): boolean {
  return channelType === "SEARCH";
}
