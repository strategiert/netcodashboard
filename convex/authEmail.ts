import type { EmailProviderSendVerificationRequestParams } from "@auth/core/providers/email";

const DEFAULT_SITE_URL = "https://netcodashboard.vercel.app";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildMagicLinkConfirmUrl(magicUrl: string, siteUrl = process.env.SITE_URL ?? DEFAULT_SITE_URL) {
  const confirmUrl = new URL("/auth/confirm", siteUrl);
  confirmUrl.hash = new URLSearchParams({ url: magicUrl }).toString();
  return confirmUrl.toString();
}

export function buildMagicLinkEmail({ confirmUrl, host }: { confirmUrl: string; host: string }) {
  const safeConfirmUrl = escapeHtml(confirmUrl);
  const safeHost = escapeHtml(host);

  return {
    subject: `Anmeldung bei ${host}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
        <h1 style="font-size: 20px; margin: 0 0 12px;">NetCo Marketing</h1>
        <p style="margin: 0 0 16px;">Klicke auf den Button, um deine Anmeldung bei ${safeHost} zu bestaetigen.</p>
        <p style="margin: 0 0 18px;">
          <a href="${safeConfirmUrl}" style="display: inline-block; background: #111827; color: #ffffff; padding: 11px 16px; border-radius: 6px; text-decoration: none; font-weight: 700;">
            Anmeldung bestaetigen
          </a>
        </p>
        <p style="margin: 0; color: #6b7280; font-size: 13px;">Dieser Link ist 24 Stunden gueltig. Falls du ihn nicht angefordert hast, kannst du diese Mail ignorieren.</p>
      </div>
    `,
    text: [
      `Anmeldung bestaetigen: ${confirmUrl}`,
      "",
      "Dieser Link ist 24 Stunden gueltig. Falls du ihn nicht angefordert hast, kannst du diese Mail ignorieren.",
    ].join("\n"),
  };
}

export async function sendMagicLinkVerificationRequest(params: EmailProviderSendVerificationRequestParams) {
  const { identifier: to, provider, url } = params;
  const siteUrl = process.env.SITE_URL ?? DEFAULT_SITE_URL;
  const host = new URL(siteUrl).host;
  const confirmUrl = buildMagicLinkConfirmUrl(url, siteUrl);
  const email = buildMagicLinkEmail({ confirmUrl, host });

  if (!provider.apiKey) {
    throw new Error("Resend API key is missing");
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${provider.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: provider.from,
      to,
      subject: email.subject,
      html: email.html,
      text: email.text,
    }),
  });

  if (!res.ok) {
    throw new Error("Resend error: " + JSON.stringify(await res.json()));
  }
}
