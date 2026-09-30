// Cloudflare Pages Function: /api/contact
// Server-Side Telegram Notification Handler

export const onRequestPost = async (context: any) => {
  const { request } = context;
  try {
    const body = (await request.json()) as any;
    const { name, email, subject, message } = body;

    const botToken = "8928205754:AAFMbBkrj7gSLgyJXrXW3I8nVFCt8s5CzR0";
    const chatId = "8049241063";
    const telegramText = `🔔 *নতুন মেসেজ এসেছে!* (IndustryMentor.net)\n\n👤 *নাম:* ${name || "N/A"}\n📧 *ইমেইল:* ${email || "N/A"}\n📌 *বিষয়:* ${subject || "N/A"}\n\n📝 *মেসেজ:*\n${message || "N/A"}`;

    const tgRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: telegramText,
        parse_mode: "Markdown",
      }),
    });

    const tgResult = await tgRes.json();
    return new Response(JSON.stringify({ success: tgRes.ok, telegram: tgResult }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
