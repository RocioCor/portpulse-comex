import { describe, it, expect } from "vitest";
import { applyStage, deadlineStatus, deadlineTime, type Req } from "./store";
const base: Req = { id: "x", decl: "D", port: "P", storage: "2026-01-01", win: "not_open", auto: true, stage: "pending", createdAt: 0 };
describe("SIM auto-trigger", () => {
  it("sends notice when auto is on", () => expect(applyStage(base, "sim_active", 5).notifiedAt).toBe(5));
  it("does not send notice when auto is off", () => expect(applyStage({ ...base, auto: false }, "sim_active", 5).notifiedAt).toBeUndefined());
});
describe("Independent logistics deadlines", () => {
  const at = new Date("2026-11-10T12:00:00").getTime();
  it("starts the terminal warning exactly 48 hours before expiry", () => {
    expect(deadlineStatus("2026-11-12T12:00", at - 1)).toBe("ok");
    expect(deadlineStatus("2026-11-12T12:00", at)).toBe("warning");
  });
  it("marks a deadline expired at its specified time", () => {
    expect(deadlineStatus("2026-11-10T12:00", at)).toBe("expired");
  });
  it("checks empty-container return independently of terminal storage", () => {
    const request = { ...base, storage: "2026-11-10T11:00", demurrage: "2026-11-17T12:00" };
    expect(deadlineStatus(request.storage, at)).toBe("expired");
    expect(deadlineStatus(request.demurrage, at)).toBe("ok");
  });
  it("does not invent a naviera deadline for existing requests", () => {
    expect(deadlineStatus(base.demurrage, at)).toBe("missing");
  });
  it("preserves legacy storage dates through the end of the day", () => {
    expect(deadlineTime("2026-11-10")).toBe(new Date("2026-11-10T23:59:59.999").getTime());
  });
});
