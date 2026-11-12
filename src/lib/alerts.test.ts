import { describe, it, expect } from "vitest";
import { dueAlerts } from "./alerts";
import type { Req } from "./store";
const H = 3600000, now = Date.parse("2026-11-12T12:00:00");
const iso = (t: number) => new Date(t).toISOString().slice(0, 16);
const base: Req = { id: "a", decl: "DIN-1", port: "SAI", entry: "2026-10-15T00:00", storage: iso(now + 100 * H), demurrage: iso(now + 100 * H), win: "not_open", auto: true, stage: "pending", createdAt: 0 };
describe("email alerts", () => {
  it("storage alerts at 48 h, not before", () => {
    expect(dueAlerts([{ ...base, storage: iso(now + 47 * H) }], now).some((a) => a.key.startsWith("storage"))).toBe(true);
    expect(dueAlerts([{ ...base, storage: iso(now + 49 * H) }], now).some((a) => a.key.startsWith("storage"))).toBe(false);
  });
  it("container alerts at 24 h, not before", () => {
    expect(dueAlerts([{ ...base, demurrage: iso(now + 23 * H) }], now).some((a) => a.key.startsWith("dem"))).toBe(true);
    expect(dueAlerts([{ ...base, demurrage: iso(now + 25 * H) }], now).some((a) => a.key.startsWith("dem"))).toBe(false);
  });
  it("turn reminder key changes every 2 h after release", () => {
    const r = { ...base, stage: "released" as const, releasedAt: now - 3 * H };
    expect(dueAlerts([r], now).find((a) => a.key.startsWith("turn"))?.key).toBe(`turn:a:${now - 3 * H}:2`);
  });
  it("completed operations never alert", () => {
    expect(dueAlerts([{ ...base, stage: "completed", demurrage: iso(now + H) }], now)).toHaveLength(0);
  });
});
