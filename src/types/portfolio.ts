export interface PortfolioRow {
  id: string;
  user_id: string;
  slug: string;
  headline: string | null;
  bio: string | null;
  career_path_id: string | null;
  location: string | null;
  linkedin_url: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface PortfolioItemRow {
  id: string;
  portfolio_id: string;
  project_submission_id: string | null;
  certificate_id: string | null;
  is_featured: boolean;
  order_index: number;
  created_at: string;
}

export interface PortfolioItemWithDetails extends PortfolioItemRow {
  submission?: {
    id: string;
    title: string | null;
    deliverable_url: string | null;
    status: string;
    submitted_at: string;
    reviewed_at: string | null;
    project?: {
      id: string;
      title: string;
      slug: string;
      domain: string | null;
      difficulty: string | null;
      short_description: string;
    };
  } | null;
  certificate?: {
    id: string;
    status: string;
    issued_at: string;
    course_id: string;
    course?: {
      id: string;
      title: string;
      slug: string;
    };
  } | null;
}

export interface PortfolioWithDetails extends PortfolioRow {
  career_path?: {
    id: string;
    title: string;
    slug: string;
    domain: string;
  } | null;
  student?: {
    full_name: string | null;
  } | null;
  items: PortfolioItemWithDetails[];
}

export interface PortfolioFormData {
  slug: string;
  headline: string;
  bio: string;
  career_path_id: string | null;
  location: string;
  linkedin_url: string;
  is_public: boolean;
}
