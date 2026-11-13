export type EmailRecipient = { email: string; name: string };

export const validEmail = (email: string) => /^[^\s@,]+@[^\s@,]+\.[^\s@,]+$/.test(email);

export function readRecipients(emails: string, names = ""): EmailRecipient[] {
  let labels: Record<string, unknown> = {};
  try {
    const parsed: unknown = JSON.parse(names);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) labels = parsed as Record<string, unknown>;
  } catch { /* Older lists have no saved names. */ }
  return [...new Set(emails.split(",").map((email) => email.trim().toLowerCase()).filter(Boolean))].map((email) => ({
    email, name: typeof labels[email] === "string" ? labels[email].trim() : "",
  }));
}

export function recipientSettings(list: EmailRecipient[], enabled: boolean) {
  return [
    { key: "alert_email", value: list.map((recipient) => recipient.email).join(", ") },
    { key: "alert_email_names", value: JSON.stringify(Object.fromEntries(list.map((recipient) => [recipient.email, recipient.name]))) },
    { key: "alerts_enabled", value: String(enabled) },
  ] as const;
}

export const recipientLabel = (recipient: EmailRecipient) => recipient.name || recipient.email.split("@")[0];