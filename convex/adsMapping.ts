export function shouldIncludeInPerformanceSnapshot(channelType: string | undefined | null): boolean {
  return Boolean(channelType);
}
