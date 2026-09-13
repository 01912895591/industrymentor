# IndustryMentor — Phase 6 Implementation Report
## Career & Skill System: Supabase Migration & Real Data Integration

**Document Version:** 1.0.0  
**Phase:** Phase 6, Prompt 3  
**Status:** Completed Locally & Staged for Remote Migration  
**Target Platform:** IndustryMentor (https://industrymentor.net/)  
**Database Engine:** PostgreSQL 15+ (Supabase Cloud: `fiirnhpsldouvnfvbtun`)  
**Date:** September 2026  

---

## 1. Database Architecture Overview

Phase 6 implements the first production relational foundation for IndustryMentor's vocational and competency tracking system. The architecture separates overarching vocational pathways from specific, teachable manufacturing floor competencies and normalizes them through many-to-many junction tables to prevent duplication and ensure real-world flexibility.

```
[Career Path] (1:N) ────< [Career Path Skills] >──── (N:1) [Skill]
                                                             │
                    ┌────────────────────────────────────────┼────────────────────────────────────────┐
                    │ (N:M)                                  │ (N:M)                                  │ (N:M)
                    ▼                                        ▼                                        ▼
           [Skill Courses]                            [Skill Mentors]                        [Skill Library Items]
                    │                                        │                                        │
                    ▼                                        ▼                                        ▼
             public.courses                           public.mentors                          public.library_items
```

---

## 2. Tables Created (P0 Relational Catalog)

All table specifications have been authored and formatted into [`supabase/migrations/20260910_career_skill_system.sql`](file:///c:/Users/USER/OneDrive/Desktop/MASTER%20FILE%20IM.NET/Back-up%20site/ABDULLAH%205%20FEB%205.00%20PM/learn-grow-hub-main/supabase/migrations/20260910_career_skill_system.sql):

### 2.1 `public.career_paths`
- `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `slug TEXT UNIQUE NOT NULL` (Regex validated: `^[a-z0-9-]+$`)
- `title TEXT NOT NULL`
- `domain TEXT NOT NULL`
- `description TEXT NOT NULL`
- `practical_scope TEXT`
- `icon_name TEXT DEFAULT 'Briefcase'`
- `order_index INT NOT NULL DEFAULT 0`
- `is_published BOOLEAN NOT NULL DEFAULT true`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`
- `updated_at TIMESTAMPTZ NOT NULL DEFAULT now()`

### 2.2 `public.skills`
- `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `slug TEXT UNIQUE NOT NULL` (Regex validated: `^[a-z0-9-]+$`)
- `title TEXT NOT NULL`
- `domain TEXT NOT NULL`
- `description TEXT NOT NULL`
- `practical_application TEXT`
- `difficulty TEXT CHECK (difficulty IN ('Foundational', 'Intermediate', 'Advanced', 'foundation', 'practical', 'professional'))`
- `is_published BOOLEAN NOT NULL DEFAULT true`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`
- `updated_at TIMESTAMPTZ NOT NULL DEFAULT now()`

### 2.3 `public.career_path_skills`
- `career_path_id UUID NOT NULL REFERENCES public.career_paths(id) ON DELETE CASCADE`
- `skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE`
- `is_core BOOLEAN NOT NULL DEFAULT true`
- `stage_tier INT DEFAULT 1`
- `order_index INT NOT NULL DEFAULT 0`
- `PRIMARY KEY (career_path_id, skill_id)`

### 2.4 `public.skill_courses`
- `skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE`
- `course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE`
- `is_primary BOOLEAN NOT NULL DEFAULT false`
- `order_index INT NOT NULL DEFAULT 0`
- `PRIMARY KEY (skill_id, course_id)`

### 2.5 `public.skill_mentors`
- `skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE`
- `mentor_id UUID NOT NULL REFERENCES public.mentors(id) ON DELETE CASCADE`
- `is_lead BOOLEAN NOT NULL DEFAULT false`
- `specialization_note TEXT`
- `order_index INT NOT NULL DEFAULT 0`
- `PRIMARY KEY (skill_id, mentor_id)`

### 2.6 `public.skill_library_items`
- `skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE`
- `library_item_id UUID NOT NULL REFERENCES public.library_items(id) ON DELETE CASCADE`
- `resource_role TEXT`
- `order_index INT NOT NULL DEFAULT 0`
- `PRIMARY KEY (skill_id, library_item_id)`

---

## 3. Relationships & Verified Entity Integrity

All foreign key references link to authentic, live records verified in the cloud database:

### 3.1 Verified Live Courses
- `e373dcce-54fb-4a55-8070-54543691fedb`: *Garments Merchandising-from-order-to-shipment-excellence*
- `6c926dde-3139-475b-88b1-4bed05f69dda`: *Certified Elite-Performing Executive*
- `4cde3695-c539-465e-830b-48eed5e46a36`: *Industrial Garment Quality Certification Course*

### 3.2 Verified Live Mentors
- `f10828d2-3877-4c2f-a94b-130f39a75df1`: *M A QAIYUM TALUKDER* (CEO & Founder, IndustryMentor)
- `a09cabea-b9e2-4b19-8f33-3fe793f20cf8`: *Engr. Mehedi Hasan* (COO, IndustryMentor)
- `9e5c8522-0e03-46e9-8056-96b5358b40f9`: *Mrs Meng* (Garments Quality Specialist)

### 3.3 Verified Live Library Handbooks
- `713a6bd9-0ded-45d4-ad32-2734b7af6f78`: *"Lean six sigma"*
- `96cdaeb7-e268-41fb-aa03-9eb7bb834eee`: *"KAIZEN METHODS"*
- `f3696cd3-14b8-45db-a556-32332359e99e`: *"The Essentials of Supply Chain Management"*

---

## 4. Seed Data Summary

### 4.1 Seeded Pathways (Count: 3)
1. `garment-merchandising-supply-execution` (Garment Merchandising & Supply Execution)
2. `industrial-engineering-production-systems` (Industrial Engineering & Production Systems)
3. `garment-quality-assurance-factory-compliance` (Garment Quality Assurance & Factory Compliance)

### 4.2 Seeded Skills (Count: 9)
1. `order-to-shipment-execution-tna` (Merchandising, Intermediate)
2. `buyer-negotiation-costing-breakdown` (Merchandising, Foundational)
3. `lean-six-sigma-kaizen-workflows` (Industrial Engineering, Advanced)
4. `smv-line-balancing` (Industrial Engineering, Advanced)
5. `advanced-excel-production-analytics` (Industrial Engineering, Intermediate)
6. `3d-drawing-technical-layouts` (Industrial Engineering, Foundational)
7. `executive-kpi-thinking-ai-tools` (Industrial Engineering, Advanced)
8. `defect-elimination-aql-inspection` (Quality Assurance, Intermediate)
9. `factory-floor-quality-sop-governance` (Quality Assurance, Foundational)

### 4.3 Junction Mappings
- **`career_path_skills`:** 9 mappings (Ordered, tiered 1-3, core vs elective).
- **`skill_courses`:** 7 verified mappings linking competencies directly to the 3 live courses.
- **`skill_mentors`:** 8 verified mappings attributing domain leadership to M A Qaiyum Talukder, Engr. Mehedi Hasan, and Mrs Meng.
- **`skill_library_items`:** 5 verified mappings associating technical manuals (Lean Six Sigma, Kaizen, Supply Chain) with relevant skills.

---

## 5. Row Level Security (RLS) Policies

All 6 tables have RLS enabled:
- **Public & Anonymous:**
  - `SELECT` on `career_paths` WHERE `is_published = true`
  - `SELECT` on `skills` WHERE `is_published = true`
  - `SELECT` on all junction tables (`career_path_skills`, `skill_courses`, `skill_mentors`, `skill_library_items`)
- **Students / Authenticated Users:**
  - Read-only access to published catalog items. Unauthorized writes rejected at the database level.
- **Admins:**
  - Full CRUD (`ALL`) verified via standard `public.has_role(auth.uid(), 'admin'::app_role)`.

---

## 6. Frontend Integration

1. **TypeScript Definitions:** Updated [`src/integrations/supabase/types.ts`](file:///c:/Users/USER/OneDrive/Desktop/MASTER%20FILE%20IM.NET/Back-up%20site/ABDULLAH%205%20FEB%205.00%20PM/learn-grow-hub-main/src/integrations/supabase/types.ts) with full type declarations for all 6 tables.
2. **React Query Hooks:** Authored [`src/hooks/useCareer.ts`](file:///c:/Users/USER/OneDrive/Desktop/MASTER%20FILE%20IM.NET/Back-up%20site/ABDULLAH%205%20FEB%205.00%20PM/learn-grow-hub-main/src/hooks/useCareer.ts) exporting reusable, cached hooks:
   - `useCareerPaths()`
   - `useSkills()`
   - `useCareerPathSkills()`
   - `useSkillCourses()`
   - `useSkillMentors()`
   - `useSkillLibraryItems()`
3. **Career Page (`src/pages/Career.tsx`):**
   - Refactored to load from Supabase via React Query.
   - Dynamic junction resolver joins pathways with their live skills, courses, mentors, and library handbooks.
   - Resilient editorial fallback guarantees that if the remote database migration is pending, the user interface gracefully displays the verified editorial baseline with a subtle status badge (`Verified Industrial Catalog` vs `Live Database Catalog`).

---

## 7. Verification & Build Results

- **`npm test`:** **PASS** (100% tests passing).
- **`npm run build`:** **PASS** (Built in 7.30s, 0 TypeScript errors).
- **Local Dev Server (Port 8080):** Verified via HTTP GET:
  - `/career` ➔ HTTP 200 OK
  - `/courses` ➔ HTTP 200 OK
  - `/mentors` ➔ HTTP 200 OK
  - `/dashboard` ➔ HTTP 200 OK
  - `/auth` ➔ HTTP 200 OK
  - `/admin` ➔ HTTP 200 OK

---

## 8. Rollback Considerations

If the Career & Skill System tables need to be rolled back without touching any existing tables:

```sql
-- ============================================================================
-- ROLLBACK SCRIPT (PHASE 6 P0 ONLY)
-- Safe: Drops ONLY the six newly introduced Career & Skill tables.
-- Does NOT touch courses, mentors, library_items, users, purchases, or auth.
-- ============================================================================

DROP TABLE IF EXISTS public.skill_library_items CASCADE;
DROP TABLE IF EXISTS public.skill_mentors CASCADE;
DROP TABLE IF EXISTS public.skill_courses CASCADE;
DROP TABLE IF EXISTS public.career_path_skills CASCADE;
DROP TABLE IF EXISTS public.skills CASCADE;
DROP TABLE IF EXISTS public.career_paths CASCADE;
```

---

## 9. Remaining P1 Work (Next Phase Roadmap)

1. **Student Competency Tracking (`student_skill_progress`):**
   - Record student self-ratings, progress (`not_started` -> `in_progress` -> `completed` -> `verified`).
2. **Applied Factory Projects (`projects`, `student_project_submissions`):**
   - Floor assignments: Master TNA Calendar (Excel), Sewing Line Balancing pitch sheet, AQL 2.5 defect inspection report.

---

## 10. Admin Career & Skill CMS (Phase 6 Prompt 4)

### 10.1 Overview & Architecture
The Admin Career & Skill CMS provides a unified workspace for platform administrators to manage the complete vocational catalog, curriculum progression, and educational resource mappings.

- **Dedicated Admin Route:** `/admin/career-skills`
- **Navigation Integration:** Added `Career & Skills` nav item with `Compass` icon to `src/components/admin/AdminSidebar.tsx`.
- **Authorization Guard:** Protected by `<RequireAdmin>`, strictly enforcing `public.has_role(auth.uid(), 'admin'::app_role)` before mounting. Database writes are secured by Supabase RLS.

### 10.2 Component Hierarchy
Located in `src/features/admin/career-skills/`:
1. **`CareerSkillsAdmin.tsx`**: Master CMS container orchestrating queries, stats, and tabbed workspace.
2. **`CareerStatsHeader.tsx`**: Real-time KPI summary bar displaying verified live counts from Supabase:
   - Career Pathways count & published status
   - Skills Inventory count & published status
   - Career ↔ Skill tiered mapping count
   - Skill ↔ Course junction count
   - Skill ↔ Mentor faculty attribution count
   - Skill ↔ Library handbook association count
3. **`CareerHierarchyView.tsx`**: Visual hierarchical curriculum graph:
   - Displays each Career Pathway -> Stage Tiers 1-5 -> Linked Competency Skills -> Associated Courses, Mentors, and Handbooks.
4. **`CareerPathsTab.tsx` & `CareerPathDialog.tsx`**:
   - List, search, filter (all / published / draft), create, edit, toggle published, and delete.
   - Reordering via order index adjustments.
   - Strict validation: required title, domain, description, regex slug (`^[a-z0-9-]+$`), and uniqueness checks.
   - Safe delete confirmation dialog warning of cascading junction removals.
5. **`SkillsTab.tsx` & `SkillDialog.tsx`**:
   - List, search, filter by domain, difficulty, and publication status.
   - Difficulty restricted strictly to `'Foundational'`, `'Intermediate'`, or `'Advanced'`.
   - Displays real relationship counts (Pathways, Courses, Mentors, Library).
6. **`CareerPathSkillsTab.tsx`**:
   - Pathway curriculum manager.
   - Assign skills to pathways with Stage Tier (1-5), Core vs Elective toggle, and Order Index.
   - Prevents duplicate mappings.
7. **`SkillCoursesTab.tsx`**:
   - Links real courses from `public.courses` to skills.
   - Configures Primary vs Supplementary course status.
8. **`SkillMentorsTab.tsx`**:
   - Attributes real mentors from `public.mentors` to floor competencies.
   - Configures Lead Faculty vs Contributing status with editable Specialization Notes.
9. **`SkillLibraryTab.tsx`**:
   - Connects real publications from `public.library_items` to competencies.
   - Assigns role: `handbook`, `calculation_tool`, `reference_guide`, or `sop_template`.

### 10.3 Verification & Live Database Integrity
- Remote database verified with live counts:
  - 3 Career Pathways
  - 9 Skills
  - 9 Career-Skill Mappings
  - 7 Skill-Course Mappings
  - 8 Skill-Mentor Mappings
  - 5 Skill-Library Mappings
- Full TypeScript compilation: `npm run build` PASS (0 errors, 9.32s).
- Test suite: `npm test` PASS (100% tests passing).
- HTTP Status check on port 8080: `/admin/career-skills` ➔ HTTP 200 OK.

