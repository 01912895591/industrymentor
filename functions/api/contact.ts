// Cloudflare Pages Function: /api/contact
// Server-Side Telegram Notification Handler

function escapeHtml(str: string = ""): string {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export const onRequestPost = async (context: any) => {
  const { request } = context;
  try {
    const body = (await request.json()) as any;
    const { name, email, subject, message } = body;

    const botToken = "8928205754:AAFMbBkrj7gSLgyJXrXW3I8nVFCt8s5CzR0";
    const chatId = "8049241063";

    const safeName = escapeHtml(name || "N/A");
    const safeEmail = escapeHtml(email || "N/A");
    const safeSubject = escapeHtml(subject || "N/A");
    const safeMessage = escapeHtml(message || "N/A");

    const telegramText = `🔔 <b>নতুন মেসেজ এসেছে!</b> (IndustryMentor.net)\n\n👤 <b>নাম:</b> ${safeName}\n📧 <b>ইমেইল:</b> ${safeEmail}\n📌 <b>বিষয়:</b> ${safeSubject}\n\n📝 <b>মেসেজ:</b>\n${safeMessage}`;

    const tgRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: telegramText,
        parse_mode: "HTML",
      }),
    });

    const tgResult = await tgRes.json();
    return new Response(JSON.stringify({ success: tgRes.ok, telegram: tgResult }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
};

export const onRequestOptions = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
};
