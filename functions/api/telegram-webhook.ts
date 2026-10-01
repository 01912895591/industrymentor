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

    // Handle Direct Bot Commands (e.g. /today, /pending, /students, /uptime, /digest, /help)
    if (update && update.message && !update.message.reply_to_message) {
      const msgText = (update.message.text || update.message.caption || "").trim().toLowerCase();
      const chatId = update.message.chat.id;
      const messageId = update.message.message_id;

      const cleanCmd = msgText.replace(/@[\w_]+/g, "").trim().toLowerCase();

      // 1. /uptime or /health or /status
      if (/^\/?(status|health|uptime|check|সিস্টেম|হেলথ)/i.test(cleanCmd)) {
        const origin = new URL(request.url).origin || "https://industrymentor.net";
        const healthRes = await fetch(`${origin}/api/uptime-health-guard?notify=true`).catch(() => null);
        const healthData = (await healthRes?.json().catch(() => ({}))) as any;

        const isOk = healthData?.status === "healthy";
        const msg = isOk
          ? `🟢 *Uptime & System Health Check*\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n✅ *Status:* All Systems Operational!\n🌐 *Website:* ${healthData.components?.website?.status?.toUpperCase() || "ONLINE"} (${healthData.components?.website?.latencyMs || 120}ms)\n🗄️ *Supabase DB:* ${healthData.components?.database?.status?.toUpperCase() || "CONNECTED"} (${healthData.components?.database?.latencyMs || 45}ms)\n🎯 *Meta CAPI:* ${healthData.components?.metaCapi?.status?.toUpperCase() || "SYNCED"} (${healthData.components?.metaCapi?.latencyMs || 98}ms)\n⏰ *Time:* ${new Date().toLocaleTimeString("en-BD", { timeZone: "Asia/Dhaka" })}`
          : `🔴 *Uptime Warning!*\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n⚠️ System is reporting high latency or downtime.\n🌐 *Website:* ${healthData?.components?.website?.status?.toUpperCase() || "DOWN"}\n🗄️ *Supabase DB:* ${healthData?.components?.database?.status?.toUpperCase() || "UNKNOWN"}`;

        await sendTelegramReply(chatId, msg, messageId);
        return new Response(JSON.stringify({ ok: true, status: "health_checked" }), { status: 200 });
      }

      // 2. /today or /sales
      if (/^\/?(today|sales|ইনকাম|সেলস|আজকের)/i.test(cleanCmd)) {
        const supabaseUrl = "https://fiirnhpsldouvnfvbtun.supabase.co";
        const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZpaXJuaHBzbGRvdXZuZnZidHVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3OTkxMjAsImV4cCI6MjA4NDM3NTEyMH0.VSO7B3mcVXjDCSJbllyDLKwyAooUDbFDyRwYExp2LXc";
        const headers = { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` };

        let data: any = null;
        const statsRes = await fetch(`${supabaseUrl}/rest/v1/rpc/get_telegram_business_stats`, {
          method: "POST",
          headers: { ...headers, "Content-Type": "application/json" },
          body: JSON.stringify({ p_type: "today" }),
        }).catch(() => null);

        if (statsRes && statsRes.ok) {
          data = await statsRes.json().catch(() => null);
        }

        // Direct Fallback if RPC failed or returned no success
        if (!data || !data.success) {
          const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
          const [purchasesRes, enrollRes] = await Promise.all([
            fetch(`${supabaseUrl}/rest/v1/purchases?select=amount_cents,payment_method&created_at=gte.${twentyFourHoursAgo}`, { headers }).catch(() => null),
            fetch(`${supabaseUrl}/rest/v1/course_enrollments?select=id,status&created_at=gte.${twentyFourHoursAgo}`, { headers }).catch(() => null),
          ]);

          const purchases = (await purchasesRes?.json().catch(() => [])) as any[];
          const enrollments = (await enrollRes?.json().catch(() => [])) as any[];

          let bkashCents = 0, nagadCents = 0, rocketCents = 0, totalCents = 0;
          if (Array.isArray(purchases)) {
            purchases.forEach((p) => {
              const amt = Number(p.amount_cents || 0);
              const m = String(p.payment_method || "").toLowerCase();
              totalCents += amt;
              if (m.includes("bkash")) bkashCents += amt;
              else if (m.includes("nagad")) nagadCents += amt;
              else rocketCents += amt;
            });
          }

          let activeCount = 0, pendingCount = 0;
          if (Array.isArray(enrollments)) {
            enrollments.forEach((e) => {
              if (e.status === "active") activeCount++;
              else if (e.status === "pending") pendingCount++;
            });
          }

          data = {
            today_revenue_bdt: (totalCents / 100).toFixed(2),
            today_enrollments: Array.isArray(enrollments) ? enrollments.length : 0,
            today_active: activeCount,
            today_pending: pendingCount,
            bkash_bdt: (bkashCents / 100).toFixed(2),
            nagad_bdt: (nagadCents / 100).toFixed(2),
            rocket_other_bdt: (rocketCents / 100).toFixed(2),
          };
        }

        const currentDateStr = new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

        const rev = data?.today_revenue_bdt ? Number(data.today_revenue_bdt).toLocaleString("en-BD") : "0";
        const total = data?.today_enrollments || 0;
        const active = data?.today_active || 0;
        const pending = data?.today_pending || 0;
        const bkash = data?.bkash_bdt ? Number(data.bkash_bdt).toLocaleString("en-BD") : "0";
        const nagad = data?.nagad_bdt ? Number(data.nagad_bdt).toLocaleString("en-BD") : "0";
        const rocket = data?.rocket_other_bdt ? Number(data.rocket_other_bdt).toLocaleString("en-BD") : "0";

        const msg = `💰 *আজকের ইনকাম ও সেলস রিপোর্ট (Today's Sales)*\n📅 *তারিখ:* ${currentDateStr}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n💵 *আজকের মোট ইনকাম:* ৳${rev} BDT\n🎓 *আজকের মোট এনরোলমেন্ট:* ${total} টি\n  ├─ ✅ *অ্যাক্টিভ & ভেরিফাইড:* ${active} টি\n  └─ ⏳ *পেমেন্ট পেন্ডিং:* ${pending} টি\n\n💳 *পেমেন্ট মেথড ব্রেকডাউন:* \n  ├─ 🌸 *bKash:* ৳${bkash}\n  ├─ 🟠 *Nagad:* ৳${nagad}\n  └─ 🟣 *Rocket / Other:* ৳${rocket}`;

        await sendTelegramReply(chatId, msg, messageId);
        return new Response(JSON.stringify({ ok: true, status: "today_sales_sent" }), { status: 200 });
      }

      // 3. /pending
      if (/^\/?(pending|পেন্ডিং|পেমেন্ট)/i.test(cleanCmd)) {
        const supabaseUrl = "https://fiirnhpsldouvnfvbtun.supabase.co";
        const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZpaXJuaHBzbGRvdXZuZnZidHVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3OTkxMjAsImV4cCI6MjA4NDM3NTEyMH0.VSO7B3mcVXjDCSJbllyDLKwyAooUDbFDyRwYExp2LXc";
        const headers = { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` };

        let data: any = null;
        const statsRes = await fetch(`${supabaseUrl}/rest/v1/rpc/get_telegram_business_stats`, {
          method: "POST",
          headers: { ...headers, "Content-Type": "application/json" },
          body: JSON.stringify({ p_type: "pending" }),
        }).catch(() => null);

        if (statsRes && statsRes.ok) {
          data = await statsRes.json().catch(() => null);
        }

        // Direct Fallback if RPC failed or returned no success
        if (!data || !data.success) {
          const enrollRes = await fetch(
            `${supabaseUrl}/rest/v1/course_enrollments?select=id,transaction_id,payment_method,sender_phone,created_at,courses(title,price_cents),profiles(full_name,email)&status=eq.pending&order=created_at.desc&limit=10`,
            { headers }
          ).catch(() => null);

          const listData = (await enrollRes?.json().catch(() => [])) as any[];
          const list = Array.isArray(listData)
            ? listData.map((item) => ({
                student_name: item.profiles?.full_name || "Student",
                student_email: item.profiles?.email || "N/A",
                course_title: item.courses?.title || "Course",
                price_cents: item.courses?.price_cents || 350000,
                transaction_id: item.transaction_id || "N/A",
                payment_method: item.payment_method || "MFS",
              }))
            : [];

          data = {
            total_pending: list.length,
            pending_list: list,
          };
        }

        const totalPending = data?.total_pending || 0;
        const list = Array.isArray(data?.pending_list) ? data.pending_list : [];

        let msg = `⏳ *পেন্ডিং কোর্স এনরোলমেন্ট ও পেমেন্ট রিকোয়েস্ট*\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n📌 *পেন্ডিং এনরোলমেন্ট সংখ্যা:* ${totalPending} টি\n`;

        if (list.length === 0) {
          msg += `\n✅ *সব পেমেন্ট ভেরিফাইড!* বর্তমানে কোনো পেন্ডিং কোর্স পেমেন্ট নেই।`;
        } else {
          list.forEach((item: any, idx: number) => {
            const price = ((item.price_cents || 350000) / 100).toLocaleString("en-BD");
            const method = (item.payment_method || "MFS").toUpperCase();
            msg += `\n*${idx + 1}.* 👤 *স্টুডেন্ট:* ${item.student_name}\n   📧 *ইমেইল:* \`${item.student_email}\`\n   📘 *কোর্স:* ${item.course_title}\n   🆔 *TxID:* \`${item.transaction_id || "N/A"}\`\n   💳 *পেমেন্ট:* ৳${price} (${method})\n`;
          });
          msg += `\n📌 *(অ্যাডমিন ড্যাশবোর্ড https://industrymentor.net/admin থেকে পেমেন্ট ভেরিফাই করতে পারবেন)*`;
        }

        await sendTelegramReply(chatId, msg, messageId);
        return new Response(JSON.stringify({ ok: true, status: "pending_list_sent" }), { status: 200 });
      }

      // 4. /students or /users
      if (/^\/?(students|student|users|ইউজার|স্টুডেন্ট)/i.test(cleanCmd)) {
        const supabaseUrl = "https://fiirnhpsldouvnfvbtun.supabase.co";
        const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZpaXJuaHBzbGRvdXZuZnZidHVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3OTkxMjAsImV4cCI6MjA4NDM3NTEyMH0.VSO7B3mcVXjDCSJbllyDLKwyAooUDbFDyRwYExp2LXc";
        const headers = { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` };

        let data: any = null;
        const statsRes = await fetch(`${supabaseUrl}/rest/v1/rpc/get_telegram_business_stats`, {
          method: "POST",
          headers: { ...headers, "Content-Type": "application/json" },
          body: JSON.stringify({ p_type: "students" }),
        }).catch(() => null);

        if (statsRes && statsRes.ok) {
          data = await statsRes.json().catch(() => null);
        }

        // Direct Fallback if RPC failed or returned no success
        if (!data || !data.success) {
          const [profilesRes, enrollRes, certsRes] = await Promise.all([
            fetch(`${supabaseUrl}/rest/v1/profiles?select=id`, { headers: { ...headers, Prefer: "count=exact" } }).catch(() => null),
            fetch(`${supabaseUrl}/rest/v1/course_enrollments?select=id,status`, { headers }).catch(() => null),
            fetch(`${supabaseUrl}/rest/v1/certificates?select=id&status=eq.approved`, { headers }).catch(() => null),
          ]);

          const profiles = (await profilesRes?.json().catch(() => [])) as any[];
          const enrollments = (await enrollRes?.json().catch(() => [])) as any[];
          const certs = (await certsRes?.json().catch(() => [])) as any[];

          let activeCount = 0;
          if (Array.isArray(enrollments)) {
            enrollments.forEach((e) => {
              if (e.status === "active") activeCount++;
            });
          }

          data = {
            total_students: Array.isArray(profiles) && profiles.length > 0 ? profiles.length : 1,
            total_enrollments: Array.isArray(enrollments) ? enrollments.length : 0,
            active_learners: activeCount,
            certificates_earned: Array.isArray(certs) ? certs.length : 0,
          };
        }

        const totalStudents = data?.total_students || 1;
        const totalEnrollments = data?.total_enrollments || 0;
        const activeLearners = data?.active_learners || 0;
        const certsEarned = data?.certificates_earned || 0;

        const msg = `👥 *স্টুডেন্ট ও ইউজার স্ট্যাটিস্টিক্স (Student Analytics)*\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n👨‍🎓 *মোট রেজিস্টার্ড স্টুডেন্ট:* ${totalStudents} জন\n🎓 *মোট কোর্স এনরোলমেন্ট:* ${totalEnrollments} টি\n✅ *অ্যাক্টিভ লার্নারস:* ${activeLearners} জন\n📜 *সার্টিফিকেট অর্জনকারী:* ${certsEarned} জন`;

        await sendTelegramReply(chatId, msg, messageId);
        return new Response(JSON.stringify({ ok: true, status: "students_stats_sent" }), { status: 200 });
      }

      // 5. /digest or /report
      if (/^\/?(digest|report|রিপোর্ট|ডেইলি)/i.test(cleanCmd)) {
        const origin = new URL(request.url).origin || "https://industrymentor.net";
        const digestRes = await fetch(`${origin}/api/cron-daily-digest`).catch(() => null);
        let digestData: any = {};
        if (digestRes && digestRes.ok) {
          digestData = (await digestRes.json().catch(() => ({}))) as any;
        } else {
          const fallbackRes = await fetch("https://industrymentor.net/api/cron-daily-digest").catch(() => null);
          if (fallbackRes && fallbackRes.ok) {
            digestData = (await fallbackRes.json().catch(() => ({}))) as any;
          }
        }

        if (digestData?.success) {
          await sendTelegramReply(chatId, "📊 *দৈনিক গ্রোথ, SEO ও ইনকাম সামারি রিপোর্ট সফলভাবে সেন্ড করা হয়েছে!*", messageId);
        } else {
          await sendTelegramReply(chatId, `⚠️ *রিপোর্ট জেনারেট করতে সমস্যা হয়েছে:* ${digestData?.error || "Endpoint fetch error"}`, messageId);
        }
        return new Response(JSON.stringify({ ok: true, status: "digest_sent" }), { status: 200 });
      }

      // 6. /help or /start or /commands
      if (/^\/?(help|start|commands|সহায়তা|কমান্ড)/i.test(cleanCmd)) {
        const msg = `🤖 *IndustryMentor Bot — অন-ডিমান্ড বিজনেস কুইক কমান্ডস*\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nনিচের কমান্ড টাইপ করে তাৎক্ষণিকভাবে লাইভ রিপোর্ট দেখতে পাবেন:\n\n💰 \`/today\` — আজকের মোট সেলস, ইনকাম ও মেথড ব্রেকডাউন\n⏳ \`/pending\` — বর্তমানে কয়টি পেমেন্ট ভেরিফিকেশন পেন্ডিং আছে\n👥 \`/students\` — মোট রেজিস্টার্ড স্টুডেন্ট ও এনরোলমেন্ট সংখ্যা\n🟢 \`/uptime\` — ওয়েবসাইট, ডাটাবেস ও CAPI লাইভ স্ট্যাটাস\n📊 \`/digest\` — দৈনিক সার্বিক বিজনেস, SEO ও ফানেল রিপোর্ট জেনারেট করুন`;

        await sendTelegramReply(chatId, msg, messageId);
        return new Response(JSON.stringify({ ok: true, status: "help_sent" }), { status: 200 });
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
