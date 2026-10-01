// Cloudflare Pages Function: /api/telegram-webhook
// Automated Telegram-to-Email Two-Way Reply & 1-Click Course Approval/Rejection Gateway

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

    // Handle Direct Bot Commands (e.g. /status, /health, uptime, /digest)
    if (update && update.message && !update.message.reply_to_message) {
      const msgText = (update.message.text || update.message.caption || "").trim().toLowerCase();
      const chatId = update.message.chat.id;
      const messageId = update.message.message_id;

      if (/^\/?(status|health|uptime|check|সিস্টেম|হেলথ)/i.test(msgText)) {
        const origin = new URL(request.url).origin;
        const healthRes = await fetch(`${origin}/api/uptime-health-guard?notify=true`);
        const healthData = (await healthRes.json().catch(() => ({}))) as any;

        const isOk = healthData.status === "healthy";
        const msg = isOk
          ? `🟢 *Uptime Health Guard Check*\n\n✅ *Status:* All Systems Operational!\n🌐 *Website:* ${healthData.components?.website?.status?.toUpperCase()} (${healthData.components?.website?.latencyMs}ms)\n🗄️ *Supabase DB:* ${healthData.components?.database?.status?.toUpperCase()} (${healthData.components?.database?.latencyMs}ms)\n🎯 *Meta CAPI:* ${healthData.components?.metaCapi?.status?.toUpperCase()} (${healthData.components?.metaCapi?.latencyMs}ms)`
          : `🔴 Alert: Website Uptime Warning! System is currently offline.\n\n⚠️ *Uptime Health Guard Alert*\n🌐 *Website:* ${healthData.components?.website?.status?.toUpperCase()}\n🗄️ *Supabase DB:* ${healthData.components?.database?.status?.toUpperCase()}\n🎯 *Meta CAPI:* ${healthData.components?.metaCapi?.status?.toUpperCase()}`;

        await sendTelegramReply(chatId, msg, messageId);
        return new Response(JSON.stringify({ ok: true, status: "health_checked" }), { status: 200 });
      }

      if (/^\/?(digest|report|রিপোর্ট|ডেইলি)/i.test(msgText)) {
        const origin = new URL(request.url).origin;
        await fetch(`${origin}/api/cron-daily-digest`);
        await sendTelegramReply(chatId, "📊 *দৈনিক সামারি রিপোর্ট সেন্ড করা হয়েছে!*", messageId);
        return new Response(JSON.stringify({ ok: true, status: "digest_sent" }), { status: 200 });
      }
    }

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

      // Check if reply is a 1-Click Course Approval or Rejection Command
      const replyTrim = replyText.trim().toLowerCase();
      const isApprovalCmd = /^(ok|approve|approved|অ্যাপ্রুভ|এপ্রুভ|done|yes|1)$/i.test(replyTrim);
      const isRejectCmd = /^(reject|cancel|rejected|cancelled|রিজেক্ট|বাতিল|no|0)$/i.test(replyTrim);

      if (isApprovalCmd || isRejectCmd) {
        // Robust Transaction ID extraction ignoring markdown asterisks, colons, or Bengali labels
        const txMatch = originalText.match(/(?:ID|ট্রানজেকশন|TxID)[^\n\r\w]*\s*([a-zA-Z0-9_-]+)/i) 
                     || originalText.match(/(?:TRX|TX)[a-zA-Z0-9_-]+/i);
        const txId = txMatch ? (txMatch[1] || txMatch[0]).trim() : null;

        const supabaseUrl = "https://fiirnhpsldouvnfvbtun.supabase.co";
        const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZpaXJuaHBzbGRvdXZuZnZidHVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3OTkxMjAsImV4cCI6MjA4NDM3NTEyMH0.VSO7B3mcVXjDCSJbllyDLKwyAooUDbFDyRwYExp2LXc";
        const headers = { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` };

        let targetEnroll: any = null;

        // Strategy A: Match by exact or pattern Transaction ID
        if (txId) {
          const resA = await fetch(
            `${supabaseUrl}/rest/v1/course_enrollments?select=id,user_id,course_id,purchase_id,status,transaction_id,payment_method,sender_phone,created_at,courses(title,price_cents),purchases(amount_cents)&status=eq.pending&transaction_id=ilike.${encodeURIComponent(txId)}`,
            { headers }
          );
          const dataA = (await resA.json().catch(() => [])) as any[];
          if (Array.isArray(dataA) && dataA.length > 0) {
            targetEnroll = dataA[0];
          }
        }

        // Strategy B: If TxID search yielded no result, search by user_id from profiles using recipientEmail
        if (!targetEnroll && recipientEmail) {
          const profileRes = await fetch(
            `${supabaseUrl}/rest/v1/profiles?select=user_id&email=ilike.${encodeURIComponent(recipientEmail.trim())}`,
            { headers }
          );
          const profileData = (await profileRes.json().catch(() => [])) as any[];
          if (Array.isArray(profileData) && profileData.length > 0 && profileData[0].user_id) {
            const userId = profileData[0].user_id;
            const resB = await fetch(
              `${supabaseUrl}/rest/v1/course_enrollments?select=id,user_id,course_id,purchase_id,status,transaction_id,payment_method,sender_phone,created_at,courses(title,price_cents),purchases(amount_cents)&status=eq.pending&user_id=eq.${userId}&order=created_at.desc`,
              { headers }
            );
            const dataB = (await resB.json().catch(() => [])) as any[];
            if (Array.isArray(dataB) && dataB.length > 0) {
              targetEnroll = dataB[0];
            }
          }
        }

        // Strategy C: Fallback to most recent pending enrollment if still not found
        if (!targetEnroll) {
          const resC = await fetch(
            `${supabaseUrl}/rest/v1/course_enrollments?select=id,user_id,course_id,purchase_id,status,transaction_id,payment_method,sender_phone,created_at,courses(title,price_cents),purchases(amount_cents)&status=eq.pending&order=created_at.desc&limit=1`,
            { headers }
          );
          const dataC = (await resC.json().catch(() => [])) as any[];
          if (Array.isArray(dataC) && dataC.length > 0) {
            targetEnroll = dataC[0];
          }
        }

        if (!targetEnroll) {
          await sendTelegramReply(
            replyMessage.chat.id,
            `⚠️ *কোনো পেন্ডিং এনরোলমেন্ট পাওয়া যায়নি!*\n\n📧 *ইমেইল:* \`${recipientEmail}\`\n🆔 *TxID:* \`${txId || "N/A"}\`\n\n📌 *কারণ:* এই স্টুডেন্টের পেমেন্ট এনরোলমেন্ট রেকর্ডটি ইতিমধ্যে অ্যাপ্রুভ বা বাতিল করা হয়ে থাকতে পারে।`,
            replyMessage.message_id
          );
          return new Response(JSON.stringify({ ok: true, status: "pending_enrollment_not_found" }), { status: 200 });
        }

        const courseTitle = targetEnroll.courses?.title || "your course";
        const priceCents = targetEnroll.purchases?.amount_cents || targetEnroll.courses?.price_cents || 350000;
        const formattedAmount = (priceCents / 100).toLocaleString("en-BD");
        const invoiceNum = `INV-IM-${Date.now().toString().slice(-8)}`;
        const paymentMethodName = (targetEnroll.payment_method || "bKash / Mobile Banking").toUpperCase();
        const transactionIdStr = targetEnroll.transaction_id || txId || "VERIFIED-TX";
        const currentDateStr = new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

          if (isApprovalCmd) {
            // Execute atomic approval RPC
            await fetch(`${supabaseUrl}/rest/v1/rpc/approve_enrollment_by_id`, {
              method: "POST",
              headers: {
                apikey: supabaseKey,
                Authorization: `Bearer ${supabaseKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ p_enrollment_id: targetEnroll.id }),
            });

            // Send Official Payment Receipt & Course Invoice email to student via Resend
            await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${resendApiKey.trim()}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                from: "IndustryMentor Support <support@industrymentor.net>",
                to: [recipientEmail],
                subject: `📄 Payment Receipt & Invoice (${invoiceNum}) — ${courseTitle}`,
                html: `<div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; padding: 24px; border: 1px solid #cbd5e1; border-radius: 16px; background-color: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
                  <div style="border-bottom: 2px solid #0284c7; padding-bottom: 16px; margin-bottom: 20px;">
                    <div style="float: right;">
                      <span style="background-color: #dcfce7; color: #15803d; border: 1px solid #86efac; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: bold; text-transform: uppercase;">
                        ✓ PAID & VERIFIED
                      </span>
                    </div>
                    <h1 style="color: #0f172a; margin: 0; font-size: 22px; font-weight: 800;">IndustryMentor.net</h1>
                    <p style="color: #64748b; margin: 4px 0 0 0; font-size: 13px;">Empowering Industry Leaders & Professional Excellence</p>
                    <div style="clear: both;"></div>
                  </div>

                  <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; margin-bottom: 24px;">
                    <h2 style="margin: 0 0 8px 0; color: #0284c7; font-size: 18px;">📄 Official Payment Receipt & Course Invoice</h2>
                    <p style="margin: 0; color: #475569; font-size: 14px; line-height: 1.5;">
                      আপনার <strong>${escapeHtml(courseTitle)}</strong> কোর্সের পেমেন্ট ভেরিফিকেশন সফলভাবে সম্পন্ন হয়েছে এবং ক্লাসরুম আনলক করা হয়েছে। নিচে আপনার অফিসিয়াল ইনভয়েস ও রসিদের কপি প্রদান করা হলো।
                    </p>
                  </div>

                  <table style="width: 100%; margin-bottom: 24px; font-size: 14px; border-collapse: collapse;">
                    <tr>
                      <td style="padding: 6px 0; color: #64748b; width: 40%;"><strong>Invoice Number:</strong></td>
                      <td style="padding: 6px 0; color: #0f172a; font-family: monospace; font-weight: bold; text-align: right;">${invoiceNum}</td>
                    </tr>
                    <tr>
                      <td style="padding: 6px 0; color: #64748b;"><strong>Issue Date:</strong></td>
                      <td style="padding: 6px 0; color: #0f172a; text-align: right;">${currentDateStr}</td>
                    </tr>
                    <tr>
                      <td style="padding: 6px 0; color: #64748b;"><strong>Student Email:</strong></td>
                      <td style="padding: 6px 0; color: #0f172a; text-align: right;">${escapeHtml(recipientEmail)}</td>
                    </tr>
                    <tr>
                      <td style="padding: 6px 0; color: #64748b;"><strong>Payment Method:</strong></td>
                      <td style="padding: 6px 0; color: #0f172a; text-align: right;">${escapeHtml(paymentMethodName)}</td>
                    </tr>
                    <tr>
                      <td style="padding: 6px 0; color: #64748b;"><strong>Transaction ID (TrxID):</strong></td>
                      <td style="padding: 6px 0; color: #0284c7; font-family: monospace; font-weight: bold; text-align: right;">${escapeHtml(transactionIdStr)}</td>
                    </tr>
                  </table>

                  <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                    <thead>
                      <tr style="background-color: #0284c7; color: #ffffff; font-size: 13px; text-transform: uppercase;">
                        <th style="padding: 10px 12px; text-align: left; border-top-left-radius: 8px;">Description</th>
                        <th style="padding: 10px 12px; text-align: right; border-top-right-radius: 8px;">Amount (BDT)</th>
                      </tr>
                    </thead>
                    <tbody style="font-size: 14px; color: #334155;">
                      <tr style="border-bottom: 1px solid #e2e8f0;">
                        <td style="padding: 12px;">
                          <strong>${escapeHtml(courseTitle)}</strong><br />
                          <span style="font-size: 12px; color: #64748b;">Full Lifetime LMS Access + SOPs + Certificate</span>
                        </td>
                        <td style="padding: 12px; text-align: right; font-weight: bold;">৳${formattedAmount}</td>
                      </tr>
                      <tr style="background-color: #f8fafc; font-weight: bold; font-size: 15px; color: #0f172a;">
                        <td style="padding: 12px; text-align: right;">Total Paid:</td>
                        <td style="padding: 12px; text-align: right; color: #16a34a;">৳${formattedAmount} BDT</td>
                      </tr>
                    </tbody>
                  </table>

                  <div style="margin: 24px 0; text-align: center;">
                    <a href="https://industrymentor.net/dashboard" style="background-color: #0284c7; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 15px;">
                      🎓 Access Your Classroom Now →
                    </a>
                  </div>

                  <div style="margin: 20px 0; padding: 16px; background-color: #f0f9ff; border: 1px solid #bae6fd; border-radius: 10px; text-align: center;">
                    <p style="margin: 0 0 10px 0; font-weight: bold; color: #0369a1; font-size: 14px;">💬 অফিশিয়াল স্টুডেন্ট সাপোর্ট টেলিগ্রাম গ্রুপে যুক্ত হন:</p>
                    <a href="https://t.me/+qOtoC46eDDcwODE1" style="background-color: #0088cc; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                      👉 Join Official Student Telegram Group 🚀
                    </a>
                  </div>

                  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0 16px 0;" />
                  <p style="font-size: 12px; color: #94a3b8; text-align: center; margin: 0;">
                    IndustryMentor.net — Official Payment Receipt & Course Enrollment Invoice<br />
                    Need help? Contact support at <a href="mailto:support@industrymentor.net" style="color: #0284c7; text-decoration: none;">support@industrymentor.net</a>
                  </p>
                </div>`,
              }),
            });

            // Reply back in Telegram confirming course unlock and invoice generation
            await sendTelegramReply(
              replyMessage.chat.id,
              `🎉 *কোর্স সফলভাবে আনলক ও ইনভয়েস জেনারেট করা হয়েছে!*\n\n📧 *স্টুডেন্ট ইমেইল:* \`${recipientEmail}\`\n📄 *ইনভয়েস নং:* \`${invoiceNum}\`\n📘 *কোর্স:* ${courseTitle}\n💳 *পেমেন্ট:* ৳${formattedAmount} BDT (${paymentMethodName})\n🆔 *ট্রানজেকশন ID:* \`${transactionIdStr}\`\n✅ *স্ট্যাটাস:* ACTIVE & INVOICE SENT`,
              replyMessage.message_id
            );
            return new Response(JSON.stringify({ ok: true, status: "approved" }), { status: 200 });
          } else {
            // Execute atomic rejection RPC
            await fetch(`${supabaseUrl}/rest/v1/rpc/reject_enrollment_by_id`, {
              method: "POST",
              headers: {
                apikey: supabaseKey,
                Authorization: `Bearer ${supabaseKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ p_enrollment_id: targetEnroll.id }),
            });

            // Send rejection notice email to student via Resend
            await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${resendApiKey.trim()}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                from: "IndustryMentor Support <support@industrymentor.net>",
                to: [recipientEmail],
                subject: `⚠️ Payment Verification Update for ${courseTitle}`,
                html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
                  <div style="margin-bottom: 20px; border-bottom: 2px solid #dc2626; padding-bottom: 12px;">
                    <h2 style="color: #dc2626; margin: 0; font-size: 20px;">⚠️ Payment Verification Update</h2>
                    <p style="color: #64748b; margin: 4px 0 0 0; font-size: 13px;">IndustryMentor.net — Action Required</p>
                  </div>
                  <p style="font-size: 15px; color: #1e293b;">Hello,</p>
                  <p style="font-size: 15px; line-height: 1.6; color: #334155;">
                    আপনার <strong>${escapeHtml(courseTitle)}</strong> কোর্সের পেমেন্ট ভেরিফিকেশন ফেইল করেছে। অনুগ্রহ করে সঠিক ট্রানজেকশন নম্বর দিয়ে পুনরায় চেষ্টা করুন।
                  </p>
                  <p style="font-size: 14px; color: #64748b;">
                    Need assistance? Reply directly to this email or contact support at <a href="https://industrymentor.net/contact-us" style="color: #0284c7;">IndustryMentor Support</a>.
                  </p>
                  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0 16px 0;" />
                  <p style="font-size: 12px; color: #94a3b8; text-align: center;">IndustryMentor.net — Empowering Industry Leaders</p>
                </div>`,
              }),
            });

            // Reply back in Telegram confirming course rejection
            await sendTelegramReply(
              replyMessage.chat.id,
              `❌ *কোর্স এনরোলমেন্ট বাতিল ও রিজেক্ট করা হয়েছে!*\n\n📧 *স্টুডেন্ট ইমেইল:* \`${recipientEmail}\`\n📘 *কোর্স:* ${courseTitle}\n🆔 *ট্রানজেকশন ID:* \`${targetEnroll.transaction_id || txId || "N/A"}\`\n⚠️ *স্ট্যাটাস:* REJECTED (Student Notified via Email)`,
              replyMessage.message_id
            );
            return new Response(JSON.stringify({ ok: true, status: "rejected" }), { status: 200 });
          }
        }
      }

      // Send standard email response for normal replies
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
