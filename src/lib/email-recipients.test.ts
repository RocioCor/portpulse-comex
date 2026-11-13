import { describe, expect, it } from "vitest";
import { readRecipients, recipientLabel, recipientSettings } from "./email-recipients";

describe("named Gmail recipients", () => {
  it("keeps a saved contact name linked to the email after reloading", () => {
    const saved = recipientSettings([{ name: "Despachante", email: "agent@example.com" }], true);
    const restored = readRecipients(saved[0].value, saved[1].value);
    expect(restored).toEqual([{ name: "Despachante", email: "agent@example.com" }]);
    const recipient = restored[0];
    if (!recipient) throw new Error("Saved contact missing");
    expect(recipientLabel(recipient)).toBe("Despachante");
  });
  it("keeps the actual address for delivery independently of the name", () => {
    expect(recipientSettings([{ name: "Despachante", email: "agent@example.com" }], true)[0]).toEqual({ key: "alert_email", value: "agent@example.com" });
  });
  it("preserves previously saved addresses without requiring names", () => {
    expect(readRecipients("agent@example.com, team@example.com")).toEqual([{ email: "agent@example.com", name: "" }, { email: "team@example.com", name: "" }]);
  });
  it("removes the contact's name and email together", () => {
    const settings = recipientSettings([{ name: "Despachante", email: "agent@example.com" }, { name: "Equipo", email: "team@example.com" }].filter((r) => r.email !== "agent@example.com"), true);
    expect(readRecipients(settings[0].value, settings[1].value)).toEqual([{ name: "Equipo", email: "team@example.com" }]);
  });
});