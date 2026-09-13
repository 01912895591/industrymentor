import { useEffect } from "react";

export interface SEOHeadProps {
  title?: string;
  description?: string;
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: "website" | "article" | "profile";
  noindex?: boolean;
  jsonLd?: Record<string, any> | Array<Record<string, any>>;
}

const DEFAULT_TITLE = "IndustryMentor — Bridge Education & Real-World Industry Knowledge";
const DEFAULT_DESCRIPTION =
  "Empowering emerging professionals with practitioner-led training, 1:1 expert mentorship, production-ready resources, and verified credentials in Garment Merchandising and Industrial Engineering.";
const DEFAULT_CANONICAL = "https://industrymentor.net/";
const DEFAULT_OG_IMAGE = "https://industrymentor.net/opengraph.png";

function setMetaTag(attributeName: "name" | "property", attributeValue: string, content: string) {
  let element = document.querySelector(`meta[${attributeName}="${attributeValue}"]`);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attributeName, attributeValue);
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
}

function setCanonicalLink(href: string) {
  let element = document.querySelector('link[rel="canonical"]');
  if (!element) {
    element = document.createElement("link");
    element.setAttribute("rel", "canonical");
    document.head.appendChild(element);
  }
  element.setAttribute("href", href);
}

export function SEOHead({
  title,
  description,
  canonicalUrl,
  ogImage,
  ogType = "website",
  noindex = false,
  jsonLd,
}: SEOHeadProps) {
  useEffect(() => {
    // 1. Document Title
    const activeTitle = title ? `${title}` : DEFAULT_TITLE;
    document.title = activeTitle;
    setMetaTag("property", "og:title", activeTitle);
    setMetaTag("name", "twitter:title", activeTitle);

    // 2. Meta Description
    const activeDesc = description || DEFAULT_DESCRIPTION;
    setMetaTag("name", "description", activeDesc);
    setMetaTag("property", "og:description", activeDesc);
    setMetaTag("name", "twitter:description", activeDesc);

    // 3. Canonical URL & OpenGraph URL
    const activeCanonical = canonicalUrl || DEFAULT_CANONICAL;
    setCanonicalLink(activeCanonical);
    setMetaTag("property", "og:url", activeCanonical);

    // 4. OpenGraph Image & Twitter Card Image
    const activeImage = ogImage || DEFAULT_OG_IMAGE;
    setMetaTag("property", "og:image", activeImage);
    setMetaTag("name", "twitter:image", activeImage);
    setMetaTag("property", "og:type", ogType);

    // 5. Robots Noindex directive
    if (noindex) {
      setMetaTag("name", "robots", "noindex, nofollow");
    } else {
      setMetaTag("name", "robots", "index, follow");
    }

    // 6. Schema.org JSON-LD Structured Data
    const scriptId = "seo-json-ld";
    let scriptElement = document.getElementById(scriptId) as HTMLScriptElement | null;

    if (jsonLd) {
      if (!scriptElement) {
        scriptElement = document.createElement("script");
        scriptElement.id = scriptId;
        scriptElement.type = "application/ld+json";
        document.head.appendChild(scriptElement);
      }
      scriptElement.textContent = JSON.stringify(jsonLd);
    } else if (scriptElement) {
      scriptElement.remove();
    }

    // Cleanup on unmount / route transition
    return () => {
      document.title = DEFAULT_TITLE;
      setMetaTag("name", "description", DEFAULT_DESCRIPTION);
      setCanonicalLink(DEFAULT_CANONICAL);
      setMetaTag("property", "og:title", DEFAULT_TITLE);
      setMetaTag("property", "og:description", DEFAULT_DESCRIPTION);
      setMetaTag("property", "og:url", DEFAULT_CANONICAL);
      setMetaTag("property", "og:image", DEFAULT_OG_IMAGE);
      setMetaTag("name", "twitter:title", DEFAULT_TITLE);
      setMetaTag("name", "twitter:description", DEFAULT_DESCRIPTION);
      setMetaTag("name", "twitter:image", DEFAULT_OG_IMAGE);
      setMetaTag("name", "robots", "index, follow");

      const cleanupScript = document.getElementById(scriptId);
      if (cleanupScript) {
        cleanupScript.remove();
      }
    };
  }, [title, description, canonicalUrl, ogImage, ogType, noindex, jsonLd]);

  return null;
}
