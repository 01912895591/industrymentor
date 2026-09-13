import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import type {
  PortfolioRow,
  PortfolioItemRow,
  PortfolioWithDetails,
  PortfolioItemWithDetails,
  PortfolioFormData,
} from "@/types/portfolio";

/**
 * Validates slug format according to database constraint:
 * ^[a-z0-9]+(-[a-z0-9]+)*$ and length between 3 and 60
 */
export function isValidSlug(slug: string): boolean {
  if (!slug) return false;
  const trimmed = slug.trim();
  return (
    trimmed.length >= 3 &&
    trimmed.length <= 60 &&
    /^[a-z0-9]+(-[a-z0-9]+)*$/.test(trimmed)
  );
}

/**
 * Generates an initial clean URL-safe slug from a user's full name or email
 */
export function generateSafeSlug(nameOrEmail?: string): string {
  if (!nameOrEmail) return `student-${Math.random().toString(36).substring(2, 8)}`;

  let clean = nameOrEmail
    .toLowerCase()
    .trim()
    .replace(/@.*$/, "") // Remove email domain if email provided
    .replace(/[^a-z0-9]+/g, "-") // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, "") // Trim leading/trailing hyphens
    .replace(/-{2,}/g, "-"); // Collapse consecutive hyphens

  if (clean.length < 3) {
    clean = `${clean || "student"}-${Math.random().toString(36).substring(2, 6)}`;
  }

  return clean.substring(0, 50);
}

/**
 * Hook for authenticated students to fetch their personal portfolio and showcase items
 */
export function useStudentPortfolio() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["student_portfolio", user?.id],
    queryFn: async (): Promise<PortfolioWithDetails | null> => {
      if (!user) return null;

      // 1. Fetch portfolio record
      const { data: portfolio, error: pError } = await supabase
        .from("portfolios")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (pError) throw pError;
      if (!portfolio) return null;

      // 2. Fetch student profile full_name
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", user.id)
        .maybeSingle();

      // 3. Fetch career path if assigned
      let careerPath = null;
      if (portfolio.career_path_id) {
        const { data: cp } = await supabase
          .from("career_paths")
          .select("id, title, slug, domain")
          .eq("id", portfolio.career_path_id)
          .maybeSingle();
        careerPath = cp;
      }

      // 4. Fetch portfolio items
      const { data: items, error: iError } = await supabase
        .from("portfolio_items")
        .select("*")
        .eq("portfolio_id", portfolio.id)
        .order("order_index", { ascending: true });

      if (iError) console.warn("Could not fetch portfolio items:", iError);

      const portfolioItems = items || [];
      const submissionIds = portfolioItems
        .map((i) => i.project_submission_id)
        .filter(Boolean) as string[];
      const certificateIds = portfolioItems
        .map((i) => i.certificate_id)
        .filter(Boolean) as string[];

      // 5. Fetch associated approved project submissions
      let submissionMap = new Map<string, any>();
      if (submissionIds.length > 0) {
        const { data: subs } = await supabase
          .from("project_submissions")
          .select("id, title, deliverable_url, status, submitted_at, reviewed_at, project_id")
          .in("id", submissionIds);

        if (subs && subs.length > 0) {
          const projectIds = Array.from(new Set(subs.map((s) => s.project_id)));
          const { data: projs } = await supabase
            .from("projects")
            .select("id, title, slug, domain, difficulty, short_description")
            .in("id", projectIds);

          const projMap = new Map(projs?.map((p) => [p.id, p]));
          subs.forEach((s) => {
            submissionMap.set(s.id, {
              ...s,
              project: projMap.get(s.project_id),
            });
          });
        }
      }

      // 6. Fetch associated approved certificates
      let certMap = new Map<string, any>();
      if (certificateIds.length > 0) {
        const { data: certs } = await supabase
          .from("certificates")
          .select("id, status, issued_at, course_id")
          .in("id", certificateIds);

        if (certs && certs.length > 0) {
          const courseIds = Array.from(new Set(certs.map((c) => c.course_id)));
          const { data: courses } = await supabase
            .from("courses")
            .select("id, title, slug")
            .in("id", courseIds);

          const courseMap = new Map(courses?.map((c) => [c.id, c]));
          certs.forEach((c) => {
            certMap.set(c.id, {
              ...c,
              course: courseMap.get(c.course_id),
            });
          });
        }
      }

      // 7. Assemble items with full details
      const populatedItems: PortfolioItemWithDetails[] = portfolioItems.map((item) => ({
        ...item,
        submission: item.project_submission_id
          ? submissionMap.get(item.project_submission_id) || null
          : null,
        certificate: item.certificate_id
          ? certMap.get(item.certificate_id) || null
          : null,
      }));

      return {
        ...portfolio,
        career_path: careerPath,
        student: {
          full_name: profile?.full_name || null,
        },
        items: populatedItems,
      };
    },
    enabled: Boolean(user),
  });
}

/**
 * Hook to fetch eligible approved project submissions for the current student
 * (Only approved submissions can be added to the portfolio)
 */
export function useEligibleApprovedProjects() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["eligible_approved_projects", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data: submissions, error } = await supabase
        .from("project_submissions")
        .select("id, title, deliverable_url, status, submitted_at, reviewed_at, project_id")
        .eq("user_id", user.id)
        .eq("status", "approved")
        .order("reviewed_at", { ascending: false });

      if (error) throw error;
      if (!submissions || submissions.length === 0) return [];

      const projectIds = Array.from(new Set(submissions.map((s) => s.project_id)));
      const { data: projects } = await supabase
        .from("projects")
        .select("id, title, slug, domain, difficulty, short_description")
        .in("id", projectIds);

      const projMap = new Map(projects?.map((p) => [p.id, p]));
      return submissions.map((s) => ({
        ...s,
        project: projMap.get(s.project_id),
      }));
    },
    enabled: Boolean(user),
  });
}

/**
 * Hook to fetch eligible approved certificates for the current student
 * (Only approved certificates can be added to the portfolio)
 */
export function useEligibleApprovedCertificates() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["eligible_approved_certificates", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data: certs, error } = await supabase
        .from("certificates")
        .select("id, status, issued_at, course_id")
        .eq("user_id", user.id)
        .eq("status", "approved")
        .order("issued_at", { ascending: false });

      if (error) throw error;
      if (!certs || certs.length === 0) return [];

      const courseIds = Array.from(new Set(certs.map((c) => c.course_id)));
      const { data: courses } = await supabase
        .from("courses")
        .select("id, title, slug")
        .in("id", courseIds);

      const courseMap = new Map(courses?.map((c) => [c.id, c]));
      return certs.map((c) => ({
        ...c,
        course: courseMap.get(c.course_id),
      }));
    },
    enabled: Boolean(user),
  });
}

/**
 * Hook to fetch a public portfolio by its URL slug
 */
export function usePublicPortfolio(slug?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["public_portfolio", slug],
    queryFn: async (): Promise<{
      portfolio: PortfolioWithDetails | null;
      isPrivate: boolean;
      notFound: boolean;
      isOwner: boolean;
    }> => {
      if (!slug) {
        return { portfolio: null, isPrivate: false, notFound: true, isOwner: false };
      }

      // 1. Fetch portfolio by slug
      const { data: portfolio, error } = await supabase
        .from("portfolios")
        .select("*")
        .eq("slug", slug.trim().toLowerCase())
        .maybeSingle();

      if (error) throw error;
      if (!portfolio) {
        return { portfolio: null, isPrivate: false, notFound: true, isOwner: false };
      }

      const isOwner = Boolean(user && user.id === portfolio.user_id);

      // Check privacy: If portfolio is private and viewer is NOT owner, block private data
      if (!portfolio.is_public && !isOwner) {
        return { portfolio: null, isPrivate: true, notFound: false, isOwner: false };
      }

      // 2. Fetch career path if present
      let careerPath = null;
      if (portfolio.career_path_id) {
        const { data: cp } = await supabase
          .from("career_paths")
          .select("id, title, slug, domain")
          .eq("id", portfolio.career_path_id)
          .maybeSingle();
        careerPath = cp;
      }

      // 3. Fetch student profile if accessible
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", portfolio.user_id)
        .maybeSingle();

      // 4. Fetch valid portfolio items
      const { data: items } = await supabase
        .from("portfolio_items")
        .select("*")
        .eq("portfolio_id", portfolio.id)
        .order("order_index", { ascending: true });

      const portfolioItems = items || [];
      const submissionIds = portfolioItems
        .map((i) => i.project_submission_id)
        .filter(Boolean) as string[];
      const certificateIds = portfolioItems
        .map((i) => i.certificate_id)
        .filter(Boolean) as string[];

      // 5. Fetch approved project submissions
      let submissionMap = new Map<string, any>();
      if (submissionIds.length > 0) {
        const { data: subs } = await supabase
          .from("project_submissions")
          .select("id, title, deliverable_url, status, submitted_at, reviewed_at, project_id")
          .in("id", submissionIds)
          .eq("status", "approved");

        if (subs && subs.length > 0) {
          const projectIds = Array.from(new Set(subs.map((s) => s.project_id)));
          const { data: projs } = await supabase
            .from("projects")
            .select("id, title, slug, domain, difficulty, short_description")
            .in("id", projectIds);

          const projMap = new Map(projs?.map((p) => [p.id, p]));
          subs.forEach((s) => {
            submissionMap.set(s.id, {
              ...s,
              project: projMap.get(s.project_id),
            });
          });
        }
      }

      // 6. Fetch approved certificates
      let certMap = new Map<string, any>();
      if (certificateIds.length > 0) {
        const { data: certs } = await supabase
          .from("certificates")
          .select("id, status, issued_at, course_id")
          .in("id", certificateIds)
          .eq("status", "approved");

        if (certs && certs.length > 0) {
          const courseIds = Array.from(new Set(certs.map((c) => c.course_id)));
          const { data: courses } = await supabase
            .from("courses")
            .select("id, title, slug")
            .in("id", courseIds);

          const courseMap = new Map(courses?.map((c) => [c.id, c]));
          certs.forEach((c) => {
            certMap.set(c.id, {
              ...c,
              course: courseMap.get(c.course_id),
            });
          });
        }
      }

      // 7. Assemble public items
      const populatedItems: PortfolioItemWithDetails[] = portfolioItems
        .map((item) => ({
          ...item,
          submission: item.project_submission_id
            ? submissionMap.get(item.project_submission_id) || null
            : null,
          certificate: item.certificate_id
            ? certMap.get(item.certificate_id) || null
            : null,
        }))
        .filter((item) => item.submission || item.certificate);

      return {
        portfolio: {
          ...portfolio,
          career_path: careerPath,
          student: {
            full_name: profile?.full_name || null,
          },
          items: populatedItems,
        },
        isPrivate: false,
        notFound: false,
        isOwner,
      };
    },
    enabled: Boolean(slug),
  });
}

/**
 * Mutation to create an initial student portfolio record
 */
export function useCreatePortfolio() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      slug,
      headline,
      bio,
      career_path_id,
      location,
      linkedin_url,
    }: Partial<PortfolioFormData>) => {
      if (!user) throw new Error("Must be logged in to create a portfolio");

      const cleanSlug = (slug || "").trim().toLowerCase();
      if (!isValidSlug(cleanSlug)) {
        throw new Error("Portfolio URL slug must be between 3 and 60 lowercase alphanumeric characters and hyphens.");
      }

      // Check slug uniqueness
      const { data: existing } = await supabase
        .from("portfolios")
        .select("id")
        .eq("slug", cleanSlug)
        .maybeSingle();

      if (existing) {
        throw new Error("This portfolio URL slug is already taken. Please choose another.");
      }

      const { data, error } = await supabase
        .from("portfolios")
        .insert({
          user_id: user.id,
          slug: cleanSlug,
          headline: headline?.trim() || null,
          bio: bio?.trim() || null,
          career_path_id: career_path_id || null,
          location: location?.trim() || null,
          linkedin_url: linkedin_url?.trim() || null,
          is_public: false, // Default to private
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student_portfolio"] });
    },
  });
}

/**
 * Mutation to update profile and privacy settings
 */
export function useUpdatePortfolio() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      portfolioId,
      formData,
    }: {
      portfolioId: string;
      formData: PortfolioFormData;
    }) => {
      if (!user) throw new Error("Must be logged in to update portfolio");

      const cleanSlug = formData.slug.trim().toLowerCase();
      if (!isValidSlug(cleanSlug)) {
        throw new Error("Portfolio URL slug must be between 3 and 60 lowercase alphanumeric characters and hyphens.");
      }

      // Check slug uniqueness if changed
      const { data: existing } = await supabase
        .from("portfolios")
        .select("id")
        .eq("slug", cleanSlug)
        .neq("id", portfolioId)
        .maybeSingle();

      if (existing) {
        throw new Error("This portfolio URL slug is already taken by another student.");
      }

      // Validate LinkedIn URL
      if (formData.linkedin_url && formData.linkedin_url.trim()) {
        const trimmed = formData.linkedin_url.trim();
        if (!/^https?:\/\/[^\s]+$/i.test(trimmed) || /^(javascript|data|file):/i.test(trimmed)) {
          throw new Error("LinkedIn URL must be a valid HTTPS link.");
        }
      }

      const { data, error } = await supabase
        .from("portfolios")
        .update({
          slug: cleanSlug,
          headline: formData.headline?.trim() || null,
          bio: formData.bio?.trim() || null,
          career_path_id: formData.career_path_id || null,
          location: formData.location?.trim() || null,
          linkedin_url: formData.linkedin_url?.trim() || null,
          is_public: formData.is_public,
        })
        .eq("id", portfolioId)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["student_portfolio"] });
      queryClient.invalidateQueries({ queryKey: ["public_portfolio", data.slug] });
    },
  });
}

/**
 * Mutation to add an approved project submission to student's portfolio showcase
 */
export function useAddProjectToPortfolio() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      portfolioId,
      projectSubmissionId,
    }: {
      portfolioId: string;
      projectSubmissionId: string;
    }) => {
      if (!user) throw new Error("Must be logged in to modify portfolio");

      // Verify the submission is approved and owned by the student
      const { data: submission, error: sErr } = await supabase
        .from("project_submissions")
        .select("id, status, user_id")
        .eq("id", projectSubmissionId)
        .eq("user_id", user.id)
        .eq("status", "approved")
        .single();

      if (sErr || !submission) {
        throw new Error("Only your own approved project submissions can be added to your portfolio.");
      }

      // Check if already in portfolio
      const { data: existing } = await supabase
        .from("portfolio_items")
        .select("id")
        .eq("portfolio_id", portfolioId)
        .eq("project_submission_id", projectSubmissionId)
        .maybeSingle();

      if (existing) {
        return existing;
      }

      // Insert portfolio item
      const { data, error } = await supabase
        .from("portfolio_items")
        .insert({
          portfolio_id: portfolioId,
          project_submission_id: projectSubmissionId,
          is_featured: false,
          order_index: 0,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student_portfolio"] });
    },
  });
}

/**
 * Mutation to add an approved certificate to student's portfolio showcase
 */
export function useAddCertificateToPortfolio() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      portfolioId,
      certificateId,
    }: {
      portfolioId: string;
      certificateId: string;
    }) => {
      if (!user) throw new Error("Must be logged in to modify portfolio");

      // Verify the certificate is approved and owned by the student
      const { data: cert, error: cErr } = await supabase
        .from("certificates")
        .select("id, status, user_id")
        .eq("id", certificateId)
        .eq("user_id", user.id)
        .eq("status", "approved")
        .single();

      if (cErr || !cert) {
        throw new Error("Only your own verified/approved certificates can be added to your portfolio.");
      }

      // Check if already in portfolio
      const { data: existing } = await supabase
        .from("portfolio_items")
        .select("id")
        .eq("portfolio_id", portfolioId)
        .eq("certificate_id", certificateId)
        .maybeSingle();

      if (existing) {
        return existing;
      }

      // Insert portfolio item
      const { data, error } = await supabase
        .from("portfolio_items")
        .insert({
          portfolio_id: portfolioId,
          certificate_id: certificateId,
          is_featured: false,
          order_index: 0,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student_portfolio"] });
    },
  });
}

/**
 * Mutation to remove a portfolio item from showcase (does not delete original submission or certificate)
 */
export function useRemovePortfolioItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ itemId }: { itemId: string }) => {
      const { error } = await supabase
        .from("portfolio_items")
        .delete()
        .eq("id", itemId);

      if (error) throw error;
      return itemId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student_portfolio"] });
    },
  });
}

/**
 * Mutation to toggle is_featured flag on a portfolio item
 */
export function useToggleFeaturedPortfolioItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      itemId,
      isFeatured,
    }: {
      itemId: string;
      isFeatured: boolean;
    }) => {
      const { data, error } = await supabase
        .from("portfolio_items")
        .update({ is_featured: isFeatured })
        .eq("id", itemId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student_portfolio"] });
    },
  });
}
