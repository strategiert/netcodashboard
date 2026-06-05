import { NextRequest } from "next/server";

/** Prüft den Team-Board-API-Key (Header `x-api-key` oder `Authorization: Bearer`). */
export function isTeamBoardAuthorized(req: NextRequest): boolean {
  const expected = process.env.TEAM_BOARD_API_KEY;
  if (!expected) return false; // fail-closed: ohne konfigurierten Key kein Zugriff
  const headerKey = req.headers.get("x-api-key");
  const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  return headerKey === expected || bearer === expected;
}
