import { it, expect } from "vitest";
import { inRange } from "./store";
it("includes deadlines on the range edges", () => { expect(inRange("2026-11-10T08:00", "2026-11-10", "2026-11-12")).toBe(true); expect(inRange("2026-11-12T23:00", "2026-11-10", "2026-11-12")).toBe(true); });
it("excludes deadlines outside the range", () => expect(inRange("2026-11-13T00:00", "2026-11-10", "2026-11-12")).toBe(false));
it("excludes operations without that deadline when filtering", () => expect(inRange(undefined, "2026-11-10", "")).toBe(false));
