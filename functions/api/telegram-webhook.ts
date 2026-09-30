// Cloudflare Pages Function: /api/telegram-webhook
// Automated Telegram-to-Email Two-Way Reply Gateway using Resend API

function escapeHtml(str: string = ""): string {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

async function sendTelegramReply(chatId: string | number, text: string, replyToMessageId?: number) {
  const botToken = "8928205754:AAFMbBkrj7gSLgyJXrXW3I8nVFCt8s5CzR0";
  try {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: "Markdown",
        reply_to_message_id: replyToMessageId,
      }),
    });
  } catch (e) {
    console.error("Error sending Telegram reply:", e);
  }
}

export const onRequest = async (context: any) => {
  const { request, env } = context;

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  if (request.method === "GET") {
    return new Response(
      JSON.stringify({
        status: "active",
        description: "Telegram-to-Email Two-Way Gateway Webhook Endpoint",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const update = (await request.json().catch(() => ({}))) as any;

    // Check if the update is a message reply
    if (update && update.message && update.message.reply_to_message) {
      const replyMessage = update.message;
      const originalMessage = replyMessage.reply_to_message;
      const replyText = replyMessage.text || replyMessage.caption || "";

      // Extract user email from original Telegram notification message text
      const originalText = originalMessage.text || originalMessage.caption || "";
      const emailMatch = originalText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);

      if (!emailMatch) {
        await sendTelegramReply(
          replyMessage.chat.id,
          "⚠️ *ইউজারের ইমেইল পাওয়া যায়নি!* মূল মেসেজে কোনো সঠিক ইমেইল ঠিকানা খুঁজে পাওয়া যায়নি।",
          replyMessage.message_id
        );
        return new Response(JSON.stringify({ ok: true, status: "no_email_found" }), { status: 200 });
      }

      const recipientEmail = emailMatch[0];
      const defaultKey = typeof atob === "function" ? atob("cmVfTVpqelZVRGhfNHRjb2JOWGhtYUxic2VQN1UzU1IycXZW") : "";
      const resendApiKey = env?.RESEND_API_KEY || defaultKey;

      if (!resendApiKey || resendApiKey.startsWith("re_...")) {
        await sendTelegramReply(
          replyMessage.chat.id,
          `⚠️ *Resend API Key সেট করা নেই!*\n\n📧 *প্রাপক:* \`${recipientEmail}\`\n📝 *আপনার উত্তর:* "${replyText}"`,
          replyMessage.message_id
        );
        return new Response(JSON.stringify({ ok: true, status: "resend_key_missing" }), { status: 200 });
      }

      // Send email to recipient via Resend API
      const resendRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey.trim()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "IndustryMentor Support <support@industrymentor.net>",
          to: [recipientEmail],
          subject: "Re: Your Inquiry at IndustryMentor.net",
          html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
            <div style="margin-bottom: 20px; border-bottom: 2px solid #0284c7; padding-bottom: 12px;">
              <h2 style="color: #0f172a; margin: 0; font-size: 20px;">IndustryMentor.net</h2>
              <p style="color: #64748b; margin: 4px 0 0 0; font-size: 13px;">Official Support Response</p>
            </div>
            <div style="font-size: 15px; line-height: 1.6; color: #1e293b; white-space: pre-wrap;">${escapeHtml(replyText)}</div>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0 16px 0;" />
            <p style="font-size: 12px; color: #94a3b8; margin: 0; text-align: center;">
              This is an official response to your inquiry submitted at <a href="https://industrymentor.net" style="color: #0284c7; text-decoration: none;">IndustryMentor.net</a>.
            </p>
          </div>`,
        }),
      });

      const resendData = (await resendRes.json().catch(() => ({}))) as any;

      if (resendRes.ok && resendData?.id) {
        await sendTelegramReply(
          replyMessage.chat.id,
          `✅ *ইমেইল সফলভাবে পাঠানো হয়েছে!*\n\n📧 *প্রাপক:* \`${recipientEmail}\`\n🆔 *Email ID:* \`${resendData.id}\`\n\n📝 *প্রেরিত উত্তর:*\n"${replyText}"`,
          replyMessage.message_id
        );
      } else {
        const errorDetail = resendData?.message || JSON.stringify(resendData);
        await sendTelegramReply(
          replyMessage.chat.id,
          `❌ *ইমেইল পাঠানো ব্যর্থ হয়েছে!*\n\n📧 *প্রাপক:* \`${recipientEmail}\`\n⚠️ *ত্রুটি:* ${errorDetail}`,
          replyMessage.message_id
        );
      }
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err: any) {
    return new Response(JSON.stringify({ ok: true, error: err.message }), { status: 200 });
  }
};
