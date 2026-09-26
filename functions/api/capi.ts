// Cloudflare Pages Function: /api/capi
// Server-Side Meta Conversions API (CAPI) Handler

interface Env {
  META_PIXEL_ID?: string;
  META_ACCESS_TOKEN?: string;
}

const DEFAULT_PIXEL_ID = "2574217453013118";

// SHA-256 Hashing helper for PII data mandated by Meta CAPI
async function sha256(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str.trim().toLowerCase());
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export const onRequestPost = async (context: any) => {
  const { request, env } = context;

  const pixelId = env?.META_PIXEL_ID || DEFAULT_PIXEL_ID;
  const accessToken = env?.META_ACCESS_TOKEN || "";

  // If access token is not set yet, return graceful acknowledgment
  if (!accessToken) {
    return new Response(
      JSON.stringify({
        success: false,
        warning: "CAPI endpoint ready. META_ACCESS_TOKEN pending configuration.",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    const body = (await request.json()) as any;
    const { event_name, event_id, event_source_url, user_data = {}, custom_data = {} } = body;

    const clientIp =
      request.headers.get("cf-connecting-ip") ||
      request.headers.get("x-real-ip") ||
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "";
    const userAgent = request.headers.get("user-agent") || "";

    // Build hashed PII user data according to Meta Graph API spec
    const formattedUserData: Record<string, any> = {
      client_ip_address: clientIp,
      client_user_agent: userAgent,
    };

    if (user_data.email) {
      formattedUserData.em = [await sha256(user_data.email)];
    }
    if (user_data.phone) {
      formattedUserData.ph = [await sha256(user_data.phone.replace(/[^0-9]/g, ""))];
    }
    if (user_data.first_name) {
      formattedUserData.fn = [await sha256(user_data.first_name)];
    }
    if (user_data.last_name) {
      formattedUserData.ln = [await sha256(user_data.last_name)];
    }
    if (user_data.fbp) {
      formattedUserData.fbp = user_data.fbp;
    }
    if (user_data.fbc) {
      formattedUserData.fbc = user_data.fbc;
    }

    const capiPayload = {
      data: [
        {
          event_name: event_name || "PageView",
          event_time: Math.floor(Date.now() / 1000),
          event_id: event_id,
          event_source_url: event_source_url || "https://industrymentor.net/",
          action_source: "website",
          user_data: formattedUserData,
          custom_data: custom_data,
        },
      ],
    };

    const graphUrl = `https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${accessToken}`;
    const fbResponse = await fetch(graphUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(capiPayload),
    });

    const result = await fbResponse.json();

    return new Response(JSON.stringify({ success: fbResponse.ok, meta_response: result }), {
      status: fbResponse.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err.message || "Failed to dispatch CAPI event" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
