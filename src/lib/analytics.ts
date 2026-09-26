// Client & Server-Side Dual Tracking Helper (Meta Pixel + Conversions API CAPI)

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
    _fbq?: any;
  }
}

export const META_PIXEL_ID = "2574217453013118";

// Generate unique event_id for Facebook deduplication (Client vs Server CAPI)
export function generateEventId(): string {
  return `im_evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Get Facebook Browser Cookie (_fbp / _fbc)
export function getCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift();
  return undefined;
}

export interface UserData {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
}

export interface CustomData {
  currency?: string;
  value?: number;
  content_name?: string;
  content_category?: string;
  content_ids?: string[];
  contents?: Array<{ id: string; quantity: number }>;
  num_items?: number;
}

// Track Dual Event (Sends to both Client-side Meta Pixel and Server-side Cloudflare CAPI)
export async function trackEvent(
  eventName: string,
  customData: CustomData = {},
  userData: UserData = {}
) {
  const eventId = generateEventId();
  const eventSourceUrl = typeof window !== "undefined" ? window.location.href : "https://industrymentor.net/";

  // 1. Client-Side Meta Pixel Event (if loaded)
  if (typeof window !== "undefined" && window.fbq) {
    try {
      window.fbq("track", eventName, customData, { eventID: eventId });
    } catch (e) {
      console.warn("Meta Pixel client track error:", e);
    }
  }

  // 2. Server-Side Cloudflare CAPI Event
  try {
    const payload = {
      event_name: eventName,
      event_id: eventId,
      event_source_url: eventSourceUrl,
      user_data: {
        email: userData.email,
        phone: userData.phone,
        first_name: userData.firstName,
        last_name: userData.lastName,
        fbp: getCookie("_fbp"),
        fbc: getCookie("_fbc"),
      },
      custom_data: customData,
    };

    fetch("/api/capi", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch((err) => {
      console.warn("CAPI dispatch warning:", err);
    });
  } catch (err) {
    console.warn("Server CAPI error:", err);
  }
}
