# Phase 7 — Prompt 6: Admin Project Review, Submission Grading & Portfolio Foundation

## 1. Executive Summary

Phase 7 Prompt 6 delivers the **Admin Project Submission Review & Evaluation CMS** alongside the **Student Portfolio & Certificate Integration Foundation** for the IndustryMentor platform. 

This system allows authenticated platform administrators and senior mentors to:
1. Access a dedicated project submissions management dashboard (`/admin/project-submissions`).
2. Search, filter, and inspect student project deliverables submitted across practical industry tracks.
3. Review deliverables against project briefs, required milestones, and evaluation rubrics.
4. Execute full lifecycle reviews (`submitted` -> `in_review` -> `approved` or `revision_required`).
5. Provide structured, timestamped qualitative feedback to students.
6. Link approved project outcomes to the student's portfolio showcase foundation while strictly preserving student privacy (`is_public = false`).
7. Safeguard existing certificate verification architectures without modifying production certificate security rules.

---

## 2. Routes Added

| Route | Guard | Description |
| :--- | :--- | :--- |
| `/admin/project-submissions` | `<RequireAdmin>` in `<AdminLayout>` | Dedicated Admin Project Submissions Review & Grading Dashboard. |

- Sidebar navigation item added under the Projects section in `src/components/admin/AdminSidebar.tsx`.
- Protected by existing role-based access control checking `user_roles.role = 'admin'` via `public.has_role(auth.uid(), 'admin')`.

---

## 3. Component Architecture

Located under `src/features/admin/project-submissions/`:

| Component | Role / Responsibility |
| :--- | :--- |
| `ProjectSubmissionsAdmin.tsx` | Master feature container managing state, live Supabase queries, search/filtering, and modal views. |
| `ProjectSubmissionStatsHeader.tsx` | Header metrics displaying Total Submissions, Needs Review, In Review, Revision Required, and Approved counts. |
| `ProjectSubmissionFilters.tsx` | Search bar, status dropdown, project selector, and sorting controls (`newest`, `oldest`, `status`). |
| `ProjectSubmissionsTable.tsx` | Comprehensive data table showing student details, project context, deliverable link, status badge, timestamps, and context actions. |
| `ProjectSubmissionReviewDialog.tsx` | Full evaluation workspace modal with tabs for rubric benchmarks, deliverables checklist, industry brief, mentor advice, deliverable link launcher, and lifecycle action controls. |
| `SubmissionStatusBadge.tsx` | Standardized status badges with distinct visual treatments and accessible icons. |
| `SubmissionTimeline.tsx` | Chronological visual progress stepper showing submission, review commencement, and completion milestones. |
| `SubmissionArtifactCard.tsx` | Safe deliverable card verifying HTTPS protocol, providing copyable links, and opening external URLs with `rel="noopener noreferrer"`. |

---

## 4. Submission Lifecycle State Machine

The review workflow strictly follows the authoritative lifecycle defined in `public.project_submissions`:

```
               [ Student Submits from Workspace ]
                               │
                               ▼
                       status: submitted
                               │
                [ Admin clicks "Start Review" ]
                               │
                               ▼
                       status: in_review
                               │
              ┌────────────────┴────────────────┐
              ▼                                 ▼
   [ Admin Approves Project ]        [ Admin Requests Revision ]
   - status: approved                - status: revision_required
   - reviewed_by: admin              - admin_feedback (min 10 chars)
   - reviewed_at: now()              - reviewed_by: admin
   - admin_feedback: optional        - reviewed_at: now()
              │                                 │
              ▼                                 ▼
   Permanent Verified Outcome         [ Student Workspace Alert ]
              │                                 │
   [ Portfolio Showcase Link ]        [ Student Updates & Resubmits ]
   - portfolio_items link created               │
   - is_public remains false                     ▼
                                         status: submitted
                                         (resets review timestamps)
```

### Review Actions & Rules
- **Start Review**: Transitions status from `submitted` to `in_review`. Sets `reviewed_by = current_admin` and `reviewed_at = now()`.
- **Approve Project**: Transitions status from `in_review` to `approved`. Accepts optional mentor comments. Sets `reviewed_by = current_admin` and `reviewed_at = now()`. Permanently locks the submission from student tampering.
- **Request Revision**: Transitions status from `in_review` to `revision_required`. Strictly enforces a minimum of 10 characters of actionable feedback. Resets review timestamps upon subsequent student resubmission.

---

## 5. Portfolio Integration Foundation

- **Authoritative Tables Reused**: `public.portfolios` and `public.portfolio_items`. No duplicate tables created.
- **Privacy First Guarantee**: Portfolios default to `is_public = false`. Admin actions to link approved submissions into `portfolio_items` strictly preserve `is_public = false`, ensuring student profiles are never prematurely made public.
- **Foreign Key & Constraint Safety**:
  - `portfolio_items` enforces `UNIQUE(portfolio_id, project_submission_id)`.
  - Constraint `portfolio_items_exactly_one_source` guarantees only valid approved artifacts are linked.
- **Feature Showcase**: Admins can verify whether an approved project is featured in the student's portfolio showcase directly from the review workspace.

---

## 6. Certificate Integration

- **Existing Architecture Preserved**: The verified certificate system and secure RPC `public.get_verified_certificate(uuid)` were audited and left 100% intact.
- **Zero Modifications**: No changes were made to `public.certificates`, existing verification pages, or certificate issuance pipelines.
- **Cross-Artifact Alignment**: `public.portfolio_items` continues to support both approved project submissions and approved certificates through mutually exclusive foreign keys.

---

## 7. Security Audit & RLS Verification

A thorough security verification was conducted across all relevant tables:

1. **`project_submissions`**:
   - `Users can view own project submissions`: Students can only read their own records (`auth.uid() = user_id`). Peer submissions cannot be inspected or leaked.
   - `Admins can manage all project submissions`: Authenticated admins with `public.has_role(auth.uid(), 'admin')` have full management privileges.
   - `Users can insert own project submissions`: Students can only create submissions with `status = 'submitted'` and null review fields.
   - `Users can update own project submissions`: Students can only modify their submissions when `status IN ('submitted', 'revision_required')`, and the `WITH CHECK` clause mandates that `status = 'submitted'`, `reviewed_by IS NULL`, and `admin_feedback IS NULL`.
2. **`portfolios` & `portfolio_items`**:
   - Students can only view their own private portfolios; public visitors can only view portfolios where `is_public = true`.
   - `portfolio_items` can only link approved submissions and approved certificates owned by the student.
   - Admins hold full management privileges without bypassing RLS.
3. **Frontend Security**:
   - Zero use of Supabase `service_role` keys.
   - External deliverable links strictly reject `javascript:`, `data:`, `file:`, and unencrypted `http://`.
   - Safe launch attributes: `target="_blank"` and `rel="noopener noreferrer"`.
   - Protected route `<RequireAdmin>` guards `/admin/project-submissions`.

---

## 8. Database Status & Migration Findings

- **Database Changes**: **NONE**
- **Existing Schema Sufficiency**: The existing database foundation created in `20260910220000_phase7_projects_portfolios_foundation.sql` already contains:
  - `public.project_submissions` with all required columns and constraints.
  - Hardened RLS policies for owner views, student insertions/updates, and admin full management (`Admins can manage all project submissions`).
  - `public.portfolios` and `public.portfolio_items` with full admin management and owner validation policies.
- **Migration Executed**: **NO** — No migration was required or executed.

---

## 9. Automated Testing & Verification

### Vitest Test Suite (`npm test`)
```
 RUN  v3.2.4 C:/Users/USER/OneDrive/Desktop/MASTER FILE IM.NET/Back-up site/ABDULLAH 5 FEB 5.00 PM/learn-grow-hub-main

 ✓ src/test/example.test.ts (1 test)
 ✓ src/test/projects.test.tsx (3 tests)
 ✓ src/test/submissions.test.tsx (7 tests)
 ✓ src/test/adminSubmissions.test.tsx (9 tests)

 Test Files  4 passed (4)
      Tests  20 passed (20)
   Duration  2.13s
```

### Production Build (`npm run build`)
- `0 errors`
- Clean production chunk output: `dist/assets/ProjectSubmissionsAdmin-BCD3IsJ7.js (54.57 kB)`

### Local HTTP Route Checks (`http://127.0.0.1:8080/`)
```
/admin/project-submissions                         HTTP 200 OK
/projects                                          HTTP 200 OK
/projects/apparel-critical-path-tna                HTTP 200 OK
/projects/apparel-critical-path-tna/workspace      HTTP 200 OK
/courses                                           HTTP 200 OK
/mentors                                           HTTP 200 OK
/career                                            HTTP 200 OK
/admin                                             HTTP 200 OK
/admin/projects                                    HTTP 200 OK
/admin/career-skills                               HTTP 200 OK
```

---

## 10. Remaining Limitations & Next Steps
- Currently, `public.project_submissions` contains 0 live production records; the admin dashboard correctly displays the verified empty state with zero fake data.
- Once real students submit deliverables, mentors can immediately begin using `/admin/project-submissions`.
