const b64 = (s: string) => btoa(Array.from(new TextEncoder().encode(s), (b) => String.fromCharCode(b)).join(""));
const hdr = (v: string) => (/^[\x00-\x7F]*$/.test(v) ? v : `=?UTF-8?B?${b64(v)}?=`);

export async function sendGmail(to: string, subject: string, body: string) {
  const lk = process.env["LOVABLE_API_KEY"], ck = process.env["GOOGLE_MAIL_API_KEY"];
  if (!lk || !ck) throw new Error("Gmail no está conectado.");
  const raw = b64([`To: ${to}`, `Subject: ${hdr(subject)}`, "MIME-Version: 1.0", 'Content-Type: text/plain; charset="UTF-8"', "", body].join("\r\n")).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const res = await fetch("https://connector-gateway.lovable.dev/google_mail/gmail/v1/users/me/messages/send", { method: "POST", headers: { Authorization: `Bearer ${lk}`, "X-Connection-Api-Key": ck, "Content-Type": "application/json" }, body: JSON.stringify({ raw }) });
  if (!res.ok) { const t = await res.text(); console.error(`Gmail ${res.status}: ${t}`); throw new Error(`Gmail respondió ${res.status}`); }
}
