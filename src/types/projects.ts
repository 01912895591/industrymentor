export type ProjectDifficulty = "Foundational" | "Intermediate" | "Advanced";

export interface ProjectDeliverable {
  title: string;
  format?: string;
  description?: string;
}

export interface ProjectEvaluationCriterion {
  criterion: string;
  weight?: string;
  description?: string;
}

export interface ProjectResource {
  title: string;
  type?: string;
  url?: string;
  notes?: string;
}

export interface ProjectRow {
  id: string;
  slug: string;
  title: string;
  short_description: string;
  detailed_brief: string | null;
  domain: string | null;
  difficulty: ProjectDifficulty | null;
  estimated_hours: number | null;
  learning_objectives: string[];
  deliverables: ProjectDeliverable[];
  evaluation_criteria: ProjectEvaluationCriterion[];
  instructions: string | null;
  resources: ProjectResource[];
  mentor_guidance: string | null;
  is_published: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface ProjectCareerPathMapping {
  project_id: string;
  career_path_id: string;
  order_index: number;
  career_path?: {
    id: string;
    title: string;
    slug: string;
    domain: string;
  };
}

export interface ProjectSkillMapping {
  project_id: string;
  skill_id: string;
  is_primary: boolean;
  order_index: number;
  skill?: {
    id: string;
    title: string;
    slug: string;
    category?: string;
  };
}

export interface ProjectWithRelations extends ProjectRow {
  career_paths: Array<{
    id: string;
    title: string;
    slug: string;
    domain: string;
  }>;
  skills: Array<{
    id: string;
    title: string;
    slug: string;
    is_primary: boolean;
  }>;
  submissions_count?: number;
}

export interface ProjectFormData {
  id?: string;
  title: string;
  slug: string;
  short_description: string;
  domain: string;
  difficulty: ProjectDifficulty;
  estimated_hours: number;
  order_index: number;
  is_published: boolean;
  detailed_brief: string;
  instructions: string;
  mentor_guidance: string;
  learning_objectives: string[];
  deliverables: ProjectDeliverable[];
  evaluation_criteria: ProjectEvaluationCriterion[];
  resources: ProjectResource[];
  career_path_ids: string[];
  skill_ids: Array<{ skill_id: string; is_primary: boolean }>;
}

export const COMMON_PROJECT_DOMAINS = [
  "Merchandising & Sourcing",
  "Industrial Engineering & Lean",
  "Quality Assurance & Compliance",
  "Garment Production & Operations",
  "Apparel Supply Chain",
  "Textile Technology",
  "Product Development & Tech Pack",
  "Sustainable Manufacturing",
] as const;

export type ProjectSubmissionStatus =
  | "submitted"
  | "in_review"
  | "approved"
  | "revision_required";

export interface ProjectSubmissionRow {
  id: string;
  project_id: string;
  user_id: string;
  title: string | null;
  submission_notes: string | null;
  deliverable_url: string | null;
  status: ProjectSubmissionStatus;
  admin_feedback: string | null;
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectSubmissionFormData {
  title: string;
  submission_notes: string;
  deliverable_url: string;
}

export interface ProjectSubmissionWithDetails extends ProjectSubmissionRow {
  project?: {
    id: string;
    title: string;
    slug: string;
    domain: string | null;
    difficulty: ProjectDifficulty | null;
    estimated_hours: number | null;
    short_description: string;
    detailed_brief: string | null;
    learning_objectives: string[];
    deliverables: ProjectDeliverable[];
    evaluation_criteria: ProjectEvaluationCriterion[];
    instructions: string | null;
    mentor_guidance: string | null;
    resources: ProjectResource[];
  };
  student?: {
    id: string;
    user_id: string;
    full_name: string | null;
    email?: string | null;
  };
  reviewer?: {
    id: string;
    full_name: string | null;
  };
  portfolio_item?: {
    id: string;
    portfolio_id: string;
    is_featured: boolean;
  } | null;
}

