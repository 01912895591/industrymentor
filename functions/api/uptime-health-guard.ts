// Cloudflare Pages Function: /api/uptime-health-guard
// Server, Supabase Database & Meta CAPI Uptime Health Guard Monitor

export const onRequest = async (context: any) => {
  const { request } = context;

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

  const url = new URL(request.url);
  const forceAlert = url.searchParams.get("test") === "offline";
  const notifyAlways = url.searchParams.get("notify") === "true";

  const botToken = "8928205754:AAFMbBkrj7gSLgyJXrXW3I8nVFCt8s5CzR0";
  const chatId = "8049241063";

  let websiteStatus = false;
  let databaseStatus = false;
  let capiStatus = false;

  let websiteLatency = 0;
  let dbLatency = 0;
  let capiLatency = 0;

  // 1. Check Website Uptime
  const webStart = Date.now();
  try {
    const webRes = await fetch("https://industrymentor.net", { method: "GET" });
    websiteLatency = Date.now() - webStart;
    websiteStatus = webRes.ok || webRes.status === 200 || webRes.status === 301 || webRes.status === 302;
  } catch (e) {
    websiteStatus = false;
  }

  // 2. Check Supabase Database Health
  const dbStart = Date.now();
  try {
    const supabaseUrl = "https://fiirnhpsldouvnfvbtun.supabase.co";
    const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZpaXJuaHBzbGRvdXZuZnZidHVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3OTkxMjAsImV4cCI6MjA4NDM3NTEyMH0.VSO7B3mcVXjDCSJbllyDLKwyAooUDbFDyRwYExp2LXc";
    const dbRes = await fetch(`${supabaseUrl}/rest/v1/courses?select=id&limit=1`, {
      headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
    });
    dbLatency = Date.now() - dbStart;
    databaseStatus = dbRes.ok;
  } catch (e) {
    databaseStatus = false;
  }

  // 3. Check Meta CAPI Health
  const capiStart = Date.now();
  try {
    const capiRes = await fetch("https://graph.facebook.com/v19.0/", { method: "GET" });
    capiLatency = Date.now() - capiStart;
    capiStatus = capiRes.ok || capiRes.status === 400 || capiRes.status === 200;
  } catch (e) {
    capiStatus = false;
  }

  const isAnyDown = !websiteStatus || !databaseStatus || !capiStatus || forceAlert;

  if (isAnyDown || notifyAlways) {
    const timeString = new Date().toLocaleString("en-US", {
      timeZone: "Asia/Dhaka",
      dateStyle: "medium",
      timeStyle: "short",
    });

    let alertMessage = "";
    if (isAnyDown) {
      alertMessage = [
        `🔴 Alert: Website Uptime Warning! System is currently offline.`,
        ``,
        `⚠️ *Uptime Health Guard Alert (IndustryMentor.net)*`,
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        `🌐 *ওয়েবসাইট (Website):* ${websiteStatus ? "✅ ONLINE (" + websiteLatency + "ms)" : "🔴 OFFLINE"}`,
        `🗄️ *সুপাবেস ডাটাবেস (Supabase DB):* ${databaseStatus ? "✅ ONLINE (" + dbLatency + "ms)" : "🔴 OFFLINE"}`,
        `🎯 *Meta CAPI / Event Tracking:* ${capiStatus ? "✅ ONLINE (" + capiLatency + "ms)" : "🔴 OFFLINE"}`,
        ``,
        `📅 *সময়:* ${timeString}`,
        `🚨 *সতর্কতা:* অবিলম্বে আপনার সার্ভার ও ডাটাবেস সংযোগ পরীক্ষা করুন!`,
      ].join("\n");
    } else {
      alertMessage = [
        `🟢 *Uptime Health Guard: All Systems Operational!*`,
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        `🌐 *ওয়েবসাইট (Website):* ✅ ONLINE (${websiteLatency}ms)`,
        `🗄️ *সুপাবেস ডাটাবেস (Supabase DB):* ✅ ONLINE (${dbLatency}ms)`,
        `🎯 *Meta CAPI / Event Tracking:* ✅ ONLINE (${capiLatency}ms)`,
        ``,
        `📅 *সময়:* ${timeString}`,
      ].join("\n");
    }

    try {
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: alertMessage,
          parse_mode: "Markdown",
        }),
      });
    } catch (e) {
      console.error("Telegram notification failed:", e);
    }
  }

  return new Response(
    JSON.stringify({
      status: isAnyDown ? "degraded" : "healthy",
      timestamp: new Date().toISOString(),
      components: {
        website: { status: websiteStatus ? "online" : "offline", latencyMs: websiteLatency },
        database: { status: databaseStatus ? "online" : "offline", latencyMs: dbLatency },
        metaCapi: { status: capiStatus ? "online" : "offline", latencyMs: capiLatency },
      },
    }),
    {
      status: isAnyDown ? 503 : 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    }
  );
};
