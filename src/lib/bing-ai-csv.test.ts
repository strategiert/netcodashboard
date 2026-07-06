import test from "node:test";
import assert from "node:assert/strict";
import { parseBingAiPerformanceCsv } from "./bing-ai-csv";

test("parseBingAiPerformanceCsv reads English AI Performance exports", () => {
  const rows = parseBingAiPerformanceCsv(
    'Date,Page,Grounding query,Topic,Intent,Citations\n2026-07-01,https://microvista.de/ct,"industrial ct, testing",CT,commercial,7\n'
  );

  assert.deepEqual(rows, [
    {
      date: "2026-07-01",
      page: "https://microvista.de/ct",
      query: "industrial ct, testing",
      topic: "CT",
      intent: "commercial",
      aiCitations: 7,
      sourceProvider: "bing-export",
    },
  ]);
});

test("parseBingAiPerformanceCsv reads German column names and decimal commas", () => {
  const rows = parseBingAiPerformanceCsv(
    'Datum,URL,Grounding Query,Thema,Intent,Citation Share,Citations\n2026-07-02,https://microvista.de/,ct analyse,CT,info,"12,5%",2\n'
  );

  assert.equal(rows[0].aiCitationShare, 0.125);
  assert.equal(rows[0].aiCitations, 2);
});
