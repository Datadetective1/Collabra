import { Resend } from "resend";

const FROM_ADDRESS = process.env.RESEND_FROM_EMAIL || "Collabra <onboarding@resend.dev>";

function getClient(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

function getBaseUrl(): string {
  return (
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "http://localhost:3000"
  );
}

export async function sendProblemMagicLink(params: {
  to: string;
  token: string;
  problemTitle: string;
}): Promise<{ ok: boolean; error?: string }> {
  const { to, token, problemTitle } = params;
  const link = `${getBaseUrl()}/submit-problem/verify?token=${encodeURIComponent(token)}`;

  const client = getClient();

  // Dev fallback: if no API key, log the link to the server console so
  // developers can still test the flow end-to-end without an email provider.
  if (!client) {
    console.log("[email:dev] RESEND_API_KEY not set — magic link (would email):");
    console.log(`  to: ${to}`);
    console.log(`  link: ${link}`);
    return { ok: true };
  }

  const safeTitle = escapeHtml(problemTitle);
  const safeLink = escapeHtml(link);

  const html = `
    <!doctype html>
    <html>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background:#f9fafb; margin:0; padding:32px;">
        <div style="max-width:560px; margin:0 auto; background:#ffffff; border:1px solid #e5e7eb; border-radius:12px; padding:32px;">
          <h1 style="font-size:20px; color:#111827; margin:0 0 12px;">Publish your problem on Collabra</h1>
          <p style="color:#374151; font-size:14px; line-height:1.6; margin:0 0 16px;">
            You're one click away from sharing <strong>${safeTitle}</strong> with a global community of builders.
          </p>
          <p style="margin:24px 0;">
            <a href="${safeLink}" style="display:inline-block; background:#4f46e5; color:#ffffff; font-weight:500; font-size:14px; padding:12px 20px; border-radius:8px; text-decoration:none;">
              Publish problem
            </a>
          </p>
          <p style="color:#6b7280; font-size:12px; line-height:1.6; margin:0 0 8px;">
            This link will expire in 30 minutes and can only be used once.
          </p>
          <p style="color:#6b7280; font-size:12px; line-height:1.6; margin:0;">
            If the button doesn't work, copy this URL:<br />
            <span style="word-break:break-all; color:#4f46e5;">${safeLink}</span>
          </p>
          <hr style="border:none; border-top:1px solid #e5e7eb; margin:24px 0;" />
          <p style="color:#9ca3af; font-size:11px; margin:0;">
            If you didn't request this, you can safely ignore this email.
          </p>
        </div>
      </body>
    </html>
  `;

  const text = [
    `Publish your problem on Collabra`,
    ``,
    `You're one click away from sharing "${problemTitle}" with a global community of builders.`,
    ``,
    `Open this link to publish:`,
    link,
    ``,
    `This link expires in 30 minutes and can only be used once.`,
    `If you didn't request this, ignore this email.`,
  ].join("\n");

  try {
    const result = await client.emails.send({
      from: FROM_ADDRESS,
      to,
      subject: `Publish your problem: ${problemTitle}`,
      html,
      text,
    });
    if (result.error) {
      console.error("[email] Resend error:", result.error);
      return { ok: false, error: result.error.message };
    }
    return { ok: true };
  } catch (err) {
    console.error("[email] send failed:", err);
    return { ok: false, error: err instanceof Error ? err.message : "Email send failed" };
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
