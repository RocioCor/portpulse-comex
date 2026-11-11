import { describe, it, expect } from "vitest";
import { turnReminder, applyStage, deadlineStatus, deadlineTime, type Req } from "./store";
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
describe("Terminal slot reminders and naviera 24h alert", () => {
  const H = 3600000;
  it("reminds every 2 hours after release", () => {
    const r = applyStage(base, "released", 0);
    expect(turnReminder(r, 0)?.count).toBe(1);
    expect(turnReminder(r, 2 * H)?.count).toBe(2);
    expect(turnReminder(r, 3 * H)?.nextInMin).toBe(60);
  });
  it("stops reminding once a slot is booked", () => expect(turnReminder({ ...applyStage(base, "released", 0), bookedAt: 1 }, H)).toBeNull());
  it("alerts naviera 24 hours before, not 48", () => {
    const at = new Date("2026-11-10T12:00:00").getTime();
    expect(deadlineStatus("2026-11-11T13:00", at, 24)).toBe("ok");
    expect(deadlineStatus("2026-11-11T12:00", at, 24)).toBe("warning");
  });
});
