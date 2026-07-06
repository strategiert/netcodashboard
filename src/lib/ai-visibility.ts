export type AiVisibilityScoreInput = {
  mentionRate?: number;
  citationShare?: number;
  linkPresenceRate?: number;
  averagePositionScore?: number;
};

export type AiVisibilitySnapshotLike = {
  brandMentioned?: boolean;
  linkPresent?: boolean;
  citationShare?: number;
  brandPosition?: number;
};

function clampRate(value: number | undefined): number {
  if (value == null || !Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

export function positionToScore(position: number | undefined): number {
  if (!position || position < 1) return 0;
  if (position === 1) return 1;
  if (position <= 3) return 0.75;
  if (position <= 5) return 0.5;
  return 0.25;
}

export function calculateAiVisibilityScore(input: AiVisibilityScoreInput): number {
  const score =
    clampRate(input.mentionRate) * 45 +
    clampRate(input.citationShare) * 30 +
    clampRate(input.linkPresenceRate) * 15 +
    clampRate(input.averagePositionScore) * 10;
  return Math.round(score * 10) / 10;
}

export function summarizeAiVisibility(rows: AiVisibilitySnapshotLike[]) {
  const total = rows.length || 1;
  const mentioned = rows.filter((row) => row.brandMentioned).length;
  const linked = rows.filter((row) => row.linkPresent).length;
  const citationShare = rows.reduce((sum, row) => sum + clampRate(row.citationShare), 0) / total;
  const averagePositionScore =
    rows.reduce((sum, row) => sum + positionToScore(row.brandPosition), 0) / total;
  const mentionRate = mentioned / total;
  const linkPresenceRate = linked / total;

  return {
    score: calculateAiVisibilityScore({
      mentionRate,
      citationShare,
      linkPresenceRate,
      averagePositionScore,
    }),
    mentionRate,
    citationShare,
    linkPresenceRate,
    averagePositionScore,
    snapshotCount: rows.length,
  };
}
