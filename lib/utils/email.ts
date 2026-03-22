/**
 * Email notification utility.
 *
 * Uses Resend (https://resend.com) - free tier: 3,000 emails/month.
 * To set up:
 *   1. Sign up at resend.com
 *   2. Verify your domain or use the sandbox (onboarding@resend.dev)
 *   3. Create an API key and add to .env.local:
 *      RESEND_API_KEY=re_xxxxxxxxxxxxx
 *      EMAIL_FROM=notifications@yourdomain.com
 */

import { connectToDatabase } from '@/lib/database';
import EmailCounter from '@/lib/database/models/emailCounter.model';

const MONTHLY_EMAIL_LIMIT = 3000;

function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export async function getMonthlyEmailCount(): Promise<number> {
  await connectToDatabase();
  const counter = await EmailCounter.findOne({ month: getCurrentMonth() });
  return counter?.count || 0;
}

async function incrementEmailCount(): Promise<number> {
  await connectToDatabase();
  const counter = await EmailCounter.findOneAndUpdate(
    { month: getCurrentMonth() },
    { $inc: { count: 1 } },
    { upsert: true, new: true }
  );
  return counter.count;
}

export async function canSendEmail(): Promise<boolean> {
  const count = await getMonthlyEmailCount();
  return count < MONTHLY_EMAIL_LIMIT;
}

type SendEmailParams = {
  to: string;
  subject: string;
  html: string;
};

export async function sendEmail({ to, subject, html }: SendEmailParams) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "FindYourAlley <onboarding@resend.dev>";

  if (!apiKey) {
    console.warn("[Email] RESEND_API_KEY not set, skipping email send.");
    return null;
  }

  if (!(await canSendEmail())) {
    console.warn(`[Email] Monthly limit (${MONTHLY_EMAIL_LIMIT}) reached, skipping.`);
    return null;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to, subject, html }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("[Email] Failed to send:", err);
      return null;
    }

    await incrementEmailCount();
    return await res.json();
  } catch (error) {
    console.error("[Email] Error:", error);
    return null;
  }
}

export function buildNewSampleEmail(eventTitle: string, matchedCategories: string[]) {
  return {
    subject: `Sample mới: ${eventTitle} - FindYourAlley`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #D87A6B;">🐙 Sample mới trên FindYourAlley!</h2>
        <p>Có sample mới phù hợp với sở thích của bạn:</p>
        <h3>${eventTitle}</h3>
        <p>Tags phù hợp: <strong>${matchedCategories.join(", ")}</strong></p>
        <p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://findyouralley.com'}"
             style="display: inline-block; background: #D87A6B; color: white; padding: 10px 20px; border-radius: 999px; text-decoration: none;">
            Xem ngay
          </a>
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #888;">
          Bạn nhận email này vì đã đăng ký thông báo trên FindYourAlley.
          Để tắt, vào trang Profile và tắt thông báo.
        </p>
      </div>
    `,
  };
}

export function buildBatchSampleEmail(events: { eventId: string; eventTitle: string; matchedCategories: string[] }[]) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://findyouralley.com';
  const eventListHtml = events.map((e) => `
    <li style="margin-bottom: 12px;">
      <a href="${baseUrl}/events/${e.eventId}" style="color: #D87A6B; font-weight: bold; text-decoration: none;">${e.eventTitle}</a><br/>
      <span style="color: #666;">Tags: ${e.matchedCategories.join(", ")}</span>
    </li>
  `).join("");

  return {
    subject: `🐙 ${events.length} sample mới phù hợp với bạn - FindYourAlley`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #D87A6B;">🐙 ${events.length} sample mới trên FindYourAlley!</h2>
        <p>Có ${events.length} sample mới phù hợp với sở thích của bạn:</p>
        <ul style="padding-left: 20px;">${eventListHtml}</ul>
        <p>
          <a href="${baseUrl}"
             style="display: inline-block; background: #D87A6B; color: white; padding: 10px 20px; border-radius: 999px; text-decoration: none;">
            Xem tất cả
          </a>
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #888;">
          Bạn nhận email này vì đã đăng ký thông báo trên FindYourAlley.
          Để tắt, vào trang Profile và tắt thông báo.
        </p>
      </div>
    `,
  };
}
