import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import React from "react";
import { SEOHead } from "@/components/seo/SEOHead";

describe("SEOHead Component", () => {
  beforeEach(() => {
    document.title = "Default Title";
    // clean any previous tags
    document.querySelectorAll('meta[name="description"]').forEach((el) => el.remove());
    document.querySelectorAll('link[rel="canonical"]').forEach((el) => el.remove());
    document.querySelectorAll('meta[name="robots"]').forEach((el) => el.remove());
    document.querySelectorAll('#seo-json-ld').forEach((el) => el.remove());
  });

  afterEach(() => {
    cleanup();
  });

  it("sets document title, meta description, and canonical URL", () => {
    render(
      <SEOHead
        title="Custom Title | IndustryMentor"
        description="Custom meta description content"
        canonicalUrl="https://industrymentor.net/custom"
      />
    );

    expect(document.title).toBe("Custom Title | IndustryMentor");

    const metaDesc = document.querySelector('meta[name="description"]');
    expect(metaDesc?.getAttribute("content")).toBe("Custom meta description content");

    const canonical = document.querySelector('link[rel="canonical"]');
    expect(canonical?.getAttribute("href")).toBe("https://industrymentor.net/custom");

    const ogTitle = document.querySelector('meta[property="og:title"]');
    expect(ogTitle?.getAttribute("content")).toBe("Custom Title | IndustryMentor");
  });

  it("handles robots noindex correctly for private pages", () => {
    render(
      <SEOHead
        title="Admin Area"
        noindex={true}
      />
    );

    const robots = document.querySelector('meta[name="robots"]');
    expect(robots?.getAttribute("content")).toBe("noindex, nofollow");
  });

  it("injects and cleans up Schema.org JSON-LD scripts", () => {
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "EducationalOrganization",
      name: "IndustryMentor",
      url: "https://industrymentor.net/",
    };

    const { unmount } = render(
      <SEOHead
        title="Home"
        jsonLd={jsonLd}
      />
    );

    const script = document.getElementById("seo-json-ld");
    expect(script).not.toBeNull();
    expect(script?.textContent).toContain("EducationalOrganization");

    unmount();
    expect(document.getElementById("seo-json-ld")).toBeNull();
  });
});
