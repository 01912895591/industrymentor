import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = "https://fiirnhpsldouvnfvbtun.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZpaXJuaHBzbGRvdXZuZnZidHVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3OTkxMjAsImV4cCI6MjA4NDM3NTEyMH0.VSO7B3mcVXjDCSJbllyDLKwyAooUDbFDyRwYExp2LXc";

const BASE_URL = "https://industrymentor.net";

// Core static pages with priorities and change frequencies
const STATIC_PAGES = [
  { url: `${BASE_URL}/`, priority: "1.0", changefreq: "daily" },
  { url: `${BASE_URL}/courses`, priority: "0.9", changefreq: "weekly" },
  { url: `${BASE_URL}/blogs`, priority: "0.9", changefreq: "weekly" },
  { url: `${BASE_URL}/mentors`, priority: "0.8", changefreq: "weekly" },
  { url: `${BASE_URL}/career`, priority: "0.9", changefreq: "weekly" },
  { url: `${BASE_URL}/projects`, priority: "0.9", changefreq: "weekly" },
  { url: `${BASE_URL}/contact-us`, priority: "0.6", changefreq: "monthly" },
  { url: `${BASE_URL}/verify`, priority: "0.5", changefreq: "monthly" },
  { url: `${BASE_URL}/privacy-policy`, priority: "0.3", changefreq: "monthly" },
  { url: `${BASE_URL}/terms-of-service`, priority: "0.3", changefreq: "monthly" },
  { url: `${BASE_URL}/refund-policy`, priority: "0.3", changefreq: "monthly" },
];

function formatDate(dateStr) {
  if (!dateStr) return "2026-09-12";
  try {
    const d = new Date(dateStr);
    return d.toISOString().split("T")[0];
  } catch {
    return "2026-09-12";
  }
}

async function fetchDynamicData() {
  const headers = {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  };

  const dynamicUrls = [];

  try {
    // 1. Published Courses
    const coursesRes = await fetch(
      `${SUPABASE_URL}/rest/v1/courses?select=id,slug,published,created_at&published=eq.true&order=created_at.desc`,
      { headers }
    );
    if (coursesRes.ok) {
      const courses = await coursesRes.json();
      if (Array.isArray(courses)) {
        courses.forEach((c) => {
          const itemSlug = c.slug || c.id;
          if (itemSlug) {
            dynamicUrls.push({
              url: `${BASE_URL}/courses/${itemSlug}`,
              lastmod: formatDate(c.created_at),
              changefreq: "weekly",
              priority: "0.85",
            });
          }
        });
      }
    }
  } catch (err) {
    console.warn("Warning: Failed to fetch courses from Supabase for sitemap:", err.message);
  }

  try {
    // 2. Published Blog Posts
    const blogsRes = await fetch(
      `${SUPABASE_URL}/rest/v1/blogs?select=id,slug,published,created_at&published=eq.true&order=created_at.desc`,
      { headers }
    );
    if (blogsRes.ok) {
      const blogs = await blogsRes.json();
      if (Array.isArray(blogs)) {
        blogs.forEach((b) => {
          const itemSlug = b.slug || b.id;
          if (itemSlug) {
            dynamicUrls.push({
              url: `${BASE_URL}/blog/${itemSlug}`,
              lastmod: formatDate(b.created_at),
              changefreq: "monthly",
              priority: "0.75",
            });
          }
        });
      }
    }
  } catch (err) {
    console.warn("Warning: Failed to fetch blogs from Supabase for sitemap:", err.message);
  }

  try {
    // 3. Mentors
    const mentorsRes = await fetch(
      `${SUPABASE_URL}/rest/v1/mentors?select=id,created_at&order=created_at.desc`,
      { headers }
    );
    if (mentorsRes.ok) {
      const mentors = await mentorsRes.json();
      if (Array.isArray(mentors)) {
        mentors.forEach((m) => {
          if (m.id) {
            dynamicUrls.push({
              url: `${BASE_URL}/mentors/${m.id}`,
              lastmod: formatDate(m.created_at),
              changefreq: "monthly",
              priority: "0.75",
            });
          }
        });
      }
    }
  } catch (err) {
    console.warn("Warning: Failed to fetch mentors from Supabase for sitemap:", err.message);
  }

  try {
    // 4. Published Projects
    const projectsRes = await fetch(
      `${SUPABASE_URL}/rest/v1/projects?select=id,slug,is_published,created_at&is_published=eq.true&order=created_at.desc`,
      { headers }
    );
    if (projectsRes.ok) {
      const projects = await projectsRes.json();
      if (Array.isArray(projects)) {
        projects.forEach((p) => {
          const itemSlug = p.slug || p.id;
          if (itemSlug) {
            dynamicUrls.push({
              url: `${BASE_URL}/projects/${itemSlug}`,
              lastmod: formatDate(p.created_at),
              changefreq: "weekly",
              priority: "0.8",
            });
          }
        });
      }
    }
  } catch (err) {
    console.warn("Warning: Failed to fetch projects from Supabase for sitemap:", err.message);
  }

  return dynamicUrls;
}

export async function generateSitemap() {
  console.log("Generating dynamic sitemap...");
  const dynamicUrls = await fetchDynamicData();

  // Combine static and dynamic, ensuring uniqueness
  const urlMap = new Map();

  STATIC_PAGES.forEach((item) => {
    urlMap.set(item.url, {
      lastmod: "2026-09-12",
      ...item,
    });
  });

  dynamicUrls.forEach((item) => {
    if (!urlMap.has(item.url)) {
      urlMap.set(item.url, item);
    }
  });

  const allUrls = Array.from(urlMap.values());

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  allUrls.forEach((entry) => {
    xml += `  <url>\n`;
    xml += `    <loc>${entry.url}</loc>\n`;
    xml += `    <lastmod>${entry.lastmod}</lastmod>\n`;
    xml += `    <changefreq>${entry.changefreq}</changefreq>\n`;
    xml += `    <priority>${entry.priority}</priority>\n`;
    xml += `  </url>\n`;
  });

  xml += `</urlset>\n`;

  const targetPath = path.resolve(__dirname, "../public/sitemap.xml");
  fs.writeFileSync(targetPath, xml, "utf-8");
  console.log(`Dynamic sitemap successfully written to ${targetPath} with ${allUrls.length} total URLs.`);
}

generateSitemap();
