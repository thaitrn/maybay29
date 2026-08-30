/**
 * Browser regression contract (Pixel 5 / throttled):
 * - 5 replay loops must not call location.reload / navigation away from SPA
 * - finish must not depend on HTTP 410; Result scene always shows
 * Full 5×60s wall run is QA/Playwright, not npm unit.
 * This file encodes the watchdog+clock invariants the e2e gate checks.
 */
export const PIXEL5 = { width: 393, height: 851 };
export const REPLAYS = 5;
export const MAX_ROUND_WALL_MS = 65_000;
export const FORBIDDEN = ['location.reload', 'HTTP 410 on in-time finish'];
