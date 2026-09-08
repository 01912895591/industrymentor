import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useLogo() {
    // Initialize from localStorage if available
    const [logoUrl, setLogoUrl] = useState<string | null>(() => {
        if (typeof window !== "undefined") {
            return localStorage.getItem("site_logo_url");
        }
        return null;
    });

    // If we have a logo in storage, we aren't "loading" (it's instant).
    // If we don't, we are loading until we verify with DB.
    const [isLoading, setIsLoading] = useState<boolean>(() => {
        if (typeof window !== "undefined") {
            return !localStorage.getItem("site_logo_url");
        }
        return true;
    });

    const fetchLogo = async () => {
        try {
            const { data, error } = await (supabase as any).rpc("get_site_settings");
            if (error) throw error;

            const url = data?.logo_url;

            // Update state and cache
            setLogoUrl(url);
            if (url) {
                localStorage.setItem("site_logo_url", url);
            } else {
                localStorage.removeItem("site_logo_url");
            }
        } catch (err) {
            console.error("Failed to load logo:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        // Fetch fresh data in background
        fetchLogo();

        // Listen for logo updates from admin panel or other tabs
        const handleUpdate = () => {
            fetchLogo();
        };

        // Listen for storage changes (cross-tab sync)
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === "site_logo_url") {
                setLogoUrl(e.newValue);
            }
        };

        window.addEventListener("logo-updated", handleUpdate);
        window.addEventListener("storage", handleStorageChange);

        return () => {
            window.removeEventListener("logo-updated", handleUpdate);
            window.removeEventListener("storage", handleStorageChange);
        };
    }, []);

    return { logoUrl, isLoading };
}
