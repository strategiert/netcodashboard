export type BingAiPerformanceRow = {
  date: string;
  page?: string;
  query?: string;
  topic?: string;
  intent?: string;
  aiCitations?: number;
  aiCitationShare?: number;
  sourceProvider: "bing-export";
};

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
      continue;
    }

    if (ch === '"') inQuotes = true;
    else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n") {
      row.push(field);
      if (row.some((cell) => cell.trim())) rows.push(row);
      row = [];
      field = "";
    } else if (ch !== "\r") {
      field += ch;
    }
  }

  if (field !== "" || row.length) {
    row.push(field);
    if (row.some((cell) => cell.trim())) rows.push(row);
  }

  return rows;
}

function normalizeHeader(header: string): string {
  return header
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "")
    .replace(/[().]/g, "");
}

function getField(row: Record<string, string>, candidates: string[]): string | undefined {
  for (const candidate of candidates) {
    const value = row[normalizeHeader(candidate)];
    if (value != null && value.trim() !== "") return value.trim();
  }
  return undefined;
}

function parseNumber(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const normalized = value.replace(/\./g, "").replace(",", ".").replace("%", "").trim();
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseShare(value: string | undefined): number | undefined {
  const parsed = parseNumber(value);
  if (parsed == null) return undefined;
  return value?.includes("%") ? parsed / 100 : parsed;
}

export function parseBingAiPerformanceCsv(text: string): BingAiPerformanceRow[] {
  const rows = parseCsv(text.replace(/^\uFEFF/, ""));
  const [headers, ...dataRows] = rows;
  if (!headers?.length) return [];

  const normalizedHeaders = headers.map(normalizeHeader);

  return dataRows
    .map((cells) => {
      const row = Object.fromEntries(
        normalizedHeaders.map((header, index) => [header, cells[index] ?? ""])
      );

      const date = getField(row, ["date", "datum"]);
      if (!date) return null;

      const citations = parseNumber(getField(row, ["citations", "citation count", "zitate"]));
      const citationShare = parseShare(
        getField(row, ["citation share", "ai citation share", "citation rate"])
      );

      const parsed: BingAiPerformanceRow = {
        date,
        sourceProvider: "bing-export",
      };
      const page = getField(row, ["page", "url", "seite"]);
      const query = getField(row, ["grounding query", "grounding queries", "query", "suchanfrage"]);
      const topic = getField(row, ["topic", "thema"]);
      const intent = getField(row, ["intent", "intention"]);

      if (page) parsed.page = page;
      if (query) parsed.query = query;
      if (topic) parsed.topic = topic;
      if (intent) parsed.intent = intent;
      if (citations != null) parsed.aiCitations = citations;
      if (citationShare != null) parsed.aiCitationShare = citationShare;

      return parsed;
    })
    .filter((row): row is BingAiPerformanceRow => row !== null);
}
