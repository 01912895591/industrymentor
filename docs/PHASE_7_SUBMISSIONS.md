# Phase 7 — Student Project Workspace & Submission System Architecture

## 1. Executive Summary

Phase 7 Prompt 5 introduces the dedicated **Student Project Workspace & Submission System** for the IndustryMentor platform. 

Authenticated students can now select any published industrial project, access a focused workspace (`/projects/:slug/workspace`), read all technical briefs, required deliverables, evaluation rubrics, and practitioner tips, and submit their solutions via HTTPS deliverable links and explanatory notes. The workspace manages the full review lifecycle, displaying reviewer feedback and enabling seamless resubmissions when revisions are requested.

---

## 2. Architecture & Design Principles

```
                                  Student (Browser)
                                          │
                   ┌──────────────────────┴──────────────────────┐
                   │                                             │
      /projects/:slug (Public Detail)            /projects/:slug/workspace (Protected)
                   │                                             │
         [ Start Project ]                                       │
                   │                                             │
         Authenticated?                                  RequireAuth Guard
          ├── No  ─► Redirect /auth (preserve state)             │
          └── Yes ─► Navigate /projects/:slug/workspace          │
                                                                 │
                                                   useProjectSubmission(projectId)
                                                                 │
                                                  ┌──────────────┴──────────────┐
                                                  ▼                             ▼
                                        Project Brief (Left)       Submission Panel (Right)
                                        - Industry Problem         - Not Submitted Form
                                        - Deliverables Checklist   - Under Review State
                                        - Step Instructions        - In Active Review
                                        - Evaluation Rubric        - Approved Badge & Notes
                                        - Mentor Guidance          - Revision Required Banner
                                        - Supporting Resources       & Resubmission Form
```

### Key Highlights
- **Zero Database Schema Changes**: Utilizes the existing `public.project_submissions` schema and hardened RLS policies established in Phase 7 Prompt 2.
- **Strict Client & Database HTTPS URL Enforcement**: Deliverable URLs are strictly validated to require `https://`, explicitly rejecting dangerous protocols (`javascript:`, `data:`, `file:`, `ftp:`) and unencrypted `http://`.
- **Row-Level Security (RLS) Enforced**: Students can only view, insert, and update their own submissions (`auth.uid() = user_id`).
- **Resubmission State Machine**: Resubmitting from `revision_required` resets `status` to `submitted`, clears review timestamps, and safely preserves historical continuity under database constraints.

---

## 3. Submission Lifecycle State Machine

The workspace dynamically renders one of five distinct states based on the student's submission record:

| Status | User Facing Badge | Workspace Behavior | Action Available |
| :--- | :--- | :--- | :--- |
| **None** (`not_submitted`) | *Not Submitted* | Displays submission form with Title, Deliverable HTTPS URL, and Optional Notes. | Submit Initial Deliverable |
| **`submitted`** | *Under Review* | Displays submitted deliverable card, timeline banner, and link to external deliverable (`rel="noopener noreferrer"`). Allows editing before review starts. | Edit Deliverable / Notes |
| **`in_review`** | *In Review* | Informs student that an IndustryMentor reviewer is currently inspecting their deliverable. Form inputs are locked. | Read-Only |
| **`approved`** | *Approved* | Green celebration banner, official approval timestamp, reviewer feedback notes, and verified deliverable link. | Permanent Record |
| **`revision_required`** | *Revision Required* | Prominent amber revision banner displaying specific reviewer feedback. Pre-populates editable form for revised submission. | Resubmit Revised Work |

---

## 4. Security & Access Control

### 4.1. Row Level Security Policies (`public.project_submissions`)
1. **SELECT**:
   ```sql
   CREATE POLICY "Users can view own project submissions"
     ON public.project_submissions
     FOR SELECT
     TO authenticated
     USING (auth.uid() = user_id);
   ```
2. **INSERT**:
   ```sql
   CREATE POLICY "Users can insert own project submissions"
     ON public.project_submissions
     FOR INSERT
     TO authenticated
     WITH CHECK (
       auth.uid() = user_id
       AND status = 'submitted'
       AND reviewed_by IS NULL
       AND reviewed_at IS NULL
       AND admin_feedback IS NULL
     );
   ```
3. **UPDATE**:
   ```sql
   CREATE POLICY "Users can update own project submissions"
     ON public.project_submissions
     FOR UPDATE
     TO authenticated
     USING (
       auth.uid() = user_id
       AND status IN ('submitted', 'revision_required')
     )
     WITH CHECK (
       auth.uid() = user_id
       AND status = 'submitted'
       AND reviewed_by IS NULL
       AND reviewed_at IS NULL
       AND admin_feedback IS NULL
     );
   ```

### 4.2. Safe Link Handling
All external deliverable links are rendered with security attributes:
- `target="_blank"`
- `rel="noopener noreferrer"`
- Pre-submission validation testing button allowing students to verify their link opens correctly before submitting.

---

## 5. File Inventory & Modifications

| File | Type | Description |
| :--- | :--- | :--- |
| `src/types/projects.ts` | Modified | Added `ProjectSubmissionStatus`, `ProjectSubmissionRow`, and `ProjectSubmissionFormData`. |
| `src/hooks/useProjectSubmission.ts` | Created | React Query hooks: `useProjectSubmission`, `useSubmitProject`, `useResubmitProject`. |
| `src/pages/ProjectWorkspace.tsx` | Created | Responsive 2-column workspace layout with project brief and multi-state submission panel. |
| `src/pages/ProjectDetail.tsx` | Modified | Updated "Start Project" CTA to route directly to `/projects/:slug/workspace` with auth preservation. |
| `src/App.tsx` | Modified | Registered lazy-loaded `/projects/:slug/workspace` route guarded by `<RequireAuth>`. |
| `src/test/submissions.test.tsx` | Created | Vitest suite testing HTTPS validation, XSS prevention, and submission lifecycle types. |

---

## 6. Verification & Quality Assurance

- **Vitest Unit Tests**: `11 passed` (100% pass rate across 3 test files).
- **TypeScript & Vite Build**: `0 errors` (`npm run build` completed cleanly).
- **Route Accessibility**: Verified HTTP 200 on `/projects`, `/projects/:slug`, and `/projects/:slug/workspace`.
- **Zero Mock/Fake Data**: No simulated projects or submissions injected into the production database.
