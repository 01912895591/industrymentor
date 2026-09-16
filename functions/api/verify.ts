// Cloudflare Pages Function: /api/verify
// Provides rate-limited, tamper-evident certificate verification

interface Env {
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_PUBLISHABLE_KEY?: string;
}

// In-memory sliding window rate limit per IP (10 requests/minute)
const rateLimitStore = new Map<string, number[]>();
const MAX_REQUESTS_PER_WINDOW = 10;
const WINDOW_MS = 60 * 1000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = (rateLimitStore.get(ip) || []).filter(t => now - t < WINDOW_MS);
  
  if (timestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    rateLimitStore.set(ip, timestamps);
    return true; // Exceeded limit
  }

  timestamps.push(now);
  rateLimitStore.set(ip, timestamps);

  // Periodic pruning of stale IPs
  if (rateLimitStore.size > 2000) {
    for (const [storedIp, list] of rateLimitStore.entries()) {
      if (list.length === 0 || now - list[list.length - 1] > WINDOW_MS) {
        rateLimitStore.delete(storedIp);
      }
    }
  }

  return false;
}

const SUPABASE_URL = "https://fiirnhpsldouvnfvbtun.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZpaXJuaHBzbGRvdXZuZnZidHVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3OTkxMjAsImV4cCI6MjA4NDM3NTEyMH0.VSO7B3mcVXjDCSJbllyDLKwyAooUDbFDyRwYExp2LXc";

export const onRequest = async (context: any) => {
  const { request } = context;
  
  // 1. Get Client IP for Rate Limiting
  const clientIp = 
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-real-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";

  // Check rate limit
  if (clientIp !== "unknown" && isRateLimited(clientIp)) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Too many verification requests. Please try again in one minute.",
        rateLimited: true,
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": "60",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }

  // 2. Extract Certificate ID from query or body
  const url = new URL(request.url);
  let certId = url.searchParams.get("id");

  if (!certId && request.method === "POST") {
    try {
      const body = await request.json() as any;
      certId = body?.id;
    } catch {
      // Ignored
    }
  }

  const cleanId = (certId || "").trim().replace(/[^a-zA-Z0-9-]/g, "");

  if (!cleanId || (cleanId.length < 8 && cleanId.length !== 36)) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Invalid certificate identifier format.",
      }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }

  try {
    let resolvedUuid: string | null = null;
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (UUID_REGEX.test(cleanId)) {
      resolvedUuid = cleanId.toLowerCase();
    } else {
      // Short alphanumeric prefix lookup
      const prefix = cleanId.toLowerCase();
      const listResp = await fetch(
        `${SUPABASE_URL}/rest/v1/certificates?select=id&status=eq.approved`,
        {
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          },
        }
      );

      if (listResp.ok) {
        const certs: Array<{ id: string }> = await listResp.json();
        const matched = certs.find((c) =>
          c.id.replace(/-/g, "").toLowerCase().startsWith(prefix)
        );
        if (matched) {
          resolvedUuid = matched.id;
        }
      }
    }

    if (!resolvedUuid) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Certificate not found or not yet approved.",
          verified: false,
        }),
        {
          status: 404,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    // 3. Call secure Postgres RPC get_verified_certificate
    const rpcResp = await fetch(
      `${SUPABASE_URL}/rest/v1/rpc/get_verified_certificate`,
      {
        method: "POST",
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cert_id: resolvedUuid }),
      }
    );

    if (!rpcResp.ok) {
      throw new Error(`RPC responded with status ${rpcResp.status}`);
    }

    const rows = await rpcResp.json();
    if (!Array.isArray(rows) || rows.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Certificate record not verified.",
          verified: false,
        }),
        {
          status: 404,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    const row = rows[0];
    const shortDisplayId = row.id.replace(/-/g, "").slice(0, 8).toUpperCase();

    return new Response(
      JSON.stringify({
        success: true,
        verified: true,
        data: {
          id: row.id,
          shortId: shortDisplayId,
          serial: `IM-${shortDisplayId}-BD`,
          studentName: row.student_name,
          courseTitle: row.course_title,
          issuedAt: row.issued_at,
          status: row.status,
          trainingHours: "40 training hours",
          issuer: "IndustryMentor (industrymentor.net)",
        },
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=300",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Verification service temporarily unavailable.",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
};
