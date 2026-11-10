import { describe, it, expect } from "vitest";
import { applyStage, type Req } from "./store";
const base: Req = { id: "x", decl: "D", port: "P", storage: "2026-01-01", win: "not_open", auto: true, stage: "pending", createdAt: 0 };
describe("SIM auto-trigger", () => {
  it("sends notice when auto is on", () => expect(applyStage(base, "sim_active", 5).notifiedAt).toBe(5));
  it("does not send notice when auto is off", () => expect(applyStage({ ...base, auto: false }, "sim_active", 5).notifiedAt).toBeUndefined());
});
