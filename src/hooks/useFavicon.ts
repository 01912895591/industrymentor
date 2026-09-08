import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useFavicon() {
    const [faviconUrl, setFaviconUrl] = useState<string | null>(null);

    const updateFaviconInDOM = (url: string | null) => {
        // Remove existing favicon links
        const existingLinks = document.querySelectorAll("link[rel*='icon']");
        existingLinks.forEach((link) => link.remove());

        // Add new favicon link
        const link = document.createElement("link");
        link.rel = "icon";
        link.type = url?.endsWith(".svg") ? "image/svg+xml" : "image/x-icon";
        link.href = url || "/favicon.ico"; // Fallback to default
        document.head.appendChild(link);
    };

    const fetchFavicon = async () => {
        try {
            const { data, error } = await (supabase as any).rpc("get_site_settings");
            if (error) throw error;

            const url = data?.favicon_url;
            setFaviconUrl(url);
            updateFaviconInDOM(url);
        } catch (err) {
            console.error("Failed to load favicon:", err);
            updateFaviconInDOM(null); // Use default
        }
    };

    useEffect(() => {
        fetchFavicon();

        // Listen for favicon updates from admin panel
        const handleUpdate = () => {
            fetchFavicon();
        };

        window.addEventListener("favicon-updated", handleUpdate);
        return () => window.removeEventListener("favicon-updated", handleUpdate);
    }, []);

    return { faviconUrl };
}
