# Phase 7 — Prompt 7: Student Portfolio Experience & Public Profile Integration

## 1. Executive Summary

Phase 7 Prompt 7 implements the **Student Portfolio Experience**, **Public Portfolio Profile**, and **Verified Artifact Showcase** for IndustryMentor.

This system enables learners to:
1. Initialize their personal industrial portfolio at `/portfolio` with a custom URL slug.
2. Manage headline, professional bio, primary career track, location, LinkedIn link, and visibility state.
3. Feature and showcase only **approved** project deliverables and **approved/verified** course certificates.
4. Share their public portfolio profile (`/portfolio/:slug`) with recruiters and peers.
5. Retain 100% privacy control (`is_public = false` by default; private portfolios block non-owner public views).
6. Safeguard certificate verification and IDOR prevention with zero changes to production database schema.

---

## 2. Architecture & Data Flow

```
                      STUDENT WORKFLOW                              PUBLIC VISITOR
                             │                                             │
      ┌──────────────────────┴──────────────────────┐                      │
      ▼                                             ▼                      │
/portfolio (Protected)                     /portfolio/:slug (Public) ◄─────┘
- Onboarding (if no portfolio)             - Checks is_public
- Profile Tab (Headline, Bio, Track,       - If Private & not owner:
  Location, LinkedIn, Privacy Switch)        Shows Friendly Private Notice
- Projects Tab (Approved Only)             - If Public (or owner):
- Certificates Tab (Verified Only)           Hero + Career Track +
- Preview & Share Tab                        Featured Projects +
                                             All Projects +
                                             Verified Certificates
```

### Core Security & Privacy Invariants
- **Database Schema Reused**: Built strictly atop existing `public.portfolios`, `public.portfolio_items`, `public.project_submissions`, and `public.certificates`.
- **Zero Database Changes**: The existing database schema and RLS policies established in Phase 7 Prompt 2 are 100% sufficient.
- **Privacy by Default**: All new portfolios initialize with `is_public = false`. Public visitors attempting to view a private portfolio cannot access any private student data or deliverable links.
- **Approved Artifacts Only**: Unapproved project submissions (`submitted`, `in_review`, `revision_required`) and unverified certificates are strictly excluded from the portfolio showcase.
- **Strict Single-Source Constraint**: Enforces the database constraint that each `portfolio_items` record links to **either** `project_submission_id` **or** `certificate_id`.

---

## 3. Routes Added & Updated

| Route | Guard | Description |
| :--- | :--- | :--- |
| `/portfolio` | `<RequireAuth>` | Student Portfolio Management Dashboard (Onboarding, Profile, Projects, Certificates, Share). |
| `/portfolio/:slug` | Public (Route-level) / Privacy-guarded (Component) | Public Profile Showcase displaying verified industrial achievements. |

- Desktop and mobile navigation in `src/components/SiteNavbar.tsx` updated to provide authenticated students with instant access to their `/portfolio`.
- Unauthenticated visitors navigating to `/portfolio` are automatically redirected to `/auth` with `{ state: { from: "/portfolio" } }`.

---

## 4. Component Inventory

Located under `src/components/portfolio/` and `src/pages/`:

| Component | Responsibility |
| :--- | :--- |
| `PortfolioDashboard.tsx` | Master student dashboard orchestrating onboarding or tabbed management. |
| `PortfolioOnboarding.tsx` | First-time portfolio creation experience with slug generator, headline, career track, and privacy notice. |
| `PortfolioProfileTab.tsx` | Profile editing, URL slug validation, LinkedIn HTTPS validation, and public/private visibility toggle. |
| `PortfolioProjectsTab.tsx` | Showcase manager for approved projects, featuring toggle, external deliverable link, and eligible projects selector. |
| `PortfolioCertificatesTab.tsx` | Showcase manager for verified course certificates with direct authenticity verification links. |
| `PortfolioPreviewTab.tsx` | Direct share card with browser Clipboard API copy button, visibility status badge, and public link launcher. |
| `PublicPortfolio.tsx` | Master public portfolio page with dynamic SEO titles, private state guard, not found handling, and achievement sections. |
| `PublicPortfolioHero.tsx` | Public profile header with student name, headline, career track badge, location, LinkedIn link, and share button. |
| `PublicProjectCard.tsx` | Public card showing project title, domain, difficulty, short description, verified outcome badge, and secure external deliverable link. |
| `PublicCertificateCard.tsx` | Public card showing course title, issuance date, verified credential badge, and link to `/verify/:id`. |

---

## 5. Visibility & Privacy Controls

- **Private Mode (`is_public = false`)**:
  - The portfolio owner and platform administrators can preview the portfolio.
  - Public visitors see a friendly notice: *"This Portfolio is Private. The owner has not made their achievements publicly visible yet."*
  - Zero private data (name, deliverables, certificates, bio) is rendered to public visitors.
- **Public Mode (`is_public = true`)**:
  - Renders the complete profile showcase.
  - External deliverable links strictly enforce `https://`, `target="_blank"`, and `rel="noopener noreferrer"`.
  - Student methodology notes (`submission_notes`) and internal reviewer notes remain private and are never exposed publicly.

---

## 6. Verification & Automated Testing

### Vitest Test Suite (`npm test`)
```
 RUN  v3.2.4 C:/Users/USER/OneDrive/Desktop/MASTER FILE IM.NET/Back-up site/ABDULLAH 5 FEB 5.00 PM/learn-grow-hub-main

 ✓ src/test/example.test.ts (1 test)
 ✓ src/test/projects.test.tsx (3 tests)
 ✓ src/test/submissions.test.tsx (7 tests)
 ✓ src/test/adminSubmissions.test.tsx (9 tests)
 ✓ src/test/portfolio.test.tsx (9 tests)

 Test Files  5 passed (5)
      Tests  29 passed (29)
   Duration  2.09s
```

### Production Build (`npm run build`)
```
✓ 3468 modules transformed.
dist/assets/PortfolioDashboard-CpHXO-a5.js        35.94 kB │ gzip:  7.53 kB
dist/assets/PublicPortfolio-7c2DLeoR.js           15.47 kB │ gzip:  4.10 kB
dist/assets/usePortfolio-CExLToCD.js              10.22 kB │ gzip:  2.47 kB
✓ built in 7.68s
```
- **0 TypeScript errors**.
- **0 build errors**.

### Local Route Checks (`http://127.0.0.1:8080/`)
```
/portfolio                                         HTTP 200 OK
/portfolio/test-slug                               HTTP 200 OK
/projects                                          HTTP 200 OK
/projects/apparel-critical-path-tna                HTTP 200 OK
/projects/apparel-critical-path-tna/workspace      HTTP 200 OK
/courses                                           HTTP 200 OK
/mentors                                           HTTP 200 OK
/career                                            HTTP 200 OK
/admin                                             HTTP 200 OK
/admin/projects                                    HTTP 200 OK
/admin/project-submissions                         HTTP 200 OK
/admin/career-skills                               HTTP 200 OK
```

---

## 7. Database Status & Migration Statement

- **Database changes**: **NONE**
- **Migration created**: **NONE**
- **Migration executed**: **NO**

The database schema and RLS policies created in Phase 7 Prompt 2 (`20260910220000_phase7_projects_portfolios_foundation.sql`) fully support student portfolio creation, item association, public visibility policies, and verified certificate integration without any modifications.
