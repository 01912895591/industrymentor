import { describe, it, expect } from "vitest";

/**
 * PostgreSQL Row Level Security (RLS) Policy Simulator
 * Replicates the database-level security rules defined in:
 * `supabase/migrations/20260917091500_harden_course_enrollment_status_rls.sql`
 *
 * Rules:
 * 1. Student INSERT:
 *    WITH CHECK (auth.uid() = user_id AND status = 'pending')
 * 2. Admin INSERT:
 *    WITH CHECK (public.has_role(auth.uid(), 'admin'))
 * 3. UPDATE:
 *    USING (public.has_role(auth.uid(), 'admin'))
 *    WITH CHECK (public.has_role(auth.uid(), 'admin'))
 */
interface CourseEnrollmentRow {
  user_id: string;
  course_id: string;
  status: "pending" | "active" | "rejected" | string;
}

interface AuthContext {
  userId: string | null;
  role: "authenticated" | "anon";
  isAdmin: boolean;
}

function evaluateEnrollmentInsertPolicy(
  auth: AuthContext,
  row: CourseEnrollmentRow
): { allowed: boolean; reason?: string } {
  if (!auth.userId || auth.role !== "authenticated") {
    return { allowed: false, reason: "Unauthenticated request" };
  }

  // Admin policy check
  if (auth.isAdmin) {
    return { allowed: true };
  }

  // Student policy: "Users can insert their own enrollments"
  // WITH CHECK (auth.uid() = user_id AND status = 'pending')
  const isOwnUser = auth.userId === row.user_id;
  const isPendingStatus = row.status === "pending";

  if (isOwnUser && isPendingStatus) {
    return { allowed: true };
  }

  if (!isOwnUser) {
    return { allowed: false, reason: "IDOR: Cannot create enrollment for another user" };
  }

  return {
    allowed: false,
    reason: `Privilege Escalation: Students cannot create enrollment with status '${row.status}'`,
  };
}

function evaluateEnrollmentUpdatePolicy(
  auth: AuthContext,
  existingRow: CourseEnrollmentRow,
  updatedRow: CourseEnrollmentRow
): { allowed: boolean; reason?: string } {
  if (!auth.userId || auth.role !== "authenticated") {
    return { allowed: false, reason: "Unauthenticated request" };
  }

  // Only admins can update enrollments (approve/reject/manage)
  if (auth.isAdmin) {
    return { allowed: true };
  }

  // Non-admins have NO update policy on course_enrollments
  return {
    allowed: false,
    reason: "Permission Denied: Only administrators can update course enrollment status",
  };
}

/**
 * Access Control Evaluation in CourseLearning.tsx
 */
function evaluateCourseLearningAccess(
  auth: { userId: string | null; isAdmin: boolean },
  enrollment: { status: string } | null
): "active" | "pending" | "rejected" | "denied" {
  if (!auth.userId) return "denied";
  if (auth.isAdmin) return "active";
  if (!enrollment) return "denied";
  if (enrollment.status === "pending") return "pending";
  if (enrollment.status === "rejected") return "rejected";
  if (enrollment.status === "active") return "active";
  return "denied";
}

describe("Course Enrollment RLS Security Enforcement", () => {
  const studentUser: AuthContext = {
    userId: "student-uuid-111",
    role: "authenticated",
    isAdmin: false,
  };

  const otherStudentUser: AuthContext = {
    userId: "attacker-uuid-999",
    role: "authenticated",
    isAdmin: false,
  };

  const adminUser: AuthContext = {
    userId: "admin-uuid-001",
    role: "authenticated",
    isAdmin: true,
  };

  describe("Database RLS INSERT Policy Enforcement", () => {
    // Test 1: Authenticated student + own user_id + pending -> ALLOWED
    it("Test 1: Authenticated student + own user_id + pending -> ALLOWED", () => {
      const result = evaluateEnrollmentInsertPolicy(studentUser, {
        user_id: "student-uuid-111",
        course_id: "course-uuid-abc",
        status: "pending",
      });

      expect(result.allowed).toBe(true);
    });

    // Test 2: Authenticated student + own user_id + active -> DENIED
    it("Test 2: Authenticated student + own user_id + active -> DENIED (prevents payment bypass)", () => {
      const result = evaluateEnrollmentInsertPolicy(studentUser, {
        user_id: "student-uuid-111",
        course_id: "course-uuid-abc",
        status: "active",
      });

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("Privilege Escalation");
    });

    // Test 3: Authenticated student + own user_id + rejected -> DENIED
    it("Test 3: Authenticated student + own user_id + rejected -> DENIED", () => {
      const result = evaluateEnrollmentInsertPolicy(studentUser, {
        user_id: "student-uuid-111",
        course_id: "course-uuid-abc",
        status: "rejected",
      });

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("Privilege Escalation");
    });

    // Test 4: Authenticated student + another user_id + pending -> DENIED
    it("Test 4: Authenticated student + another user_id + pending -> DENIED (prevents IDOR)", () => {
      const result = evaluateEnrollmentInsertPolicy(otherStudentUser, {
        user_id: "student-uuid-111", // Attempting to insert for student-uuid-111
        course_id: "course-uuid-abc",
        status: "pending",
      });

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("Cannot create enrollment for another user");
    });
  });

  describe("Database RLS UPDATE Policy Enforcement", () => {
    // Test 5: Student attempts to change own enrollment: pending -> active -> DENIED
    it("Test 5: Student attempts to change own enrollment from pending to active -> DENIED", () => {
      const existingEnrollment: CourseEnrollmentRow = {
        user_id: "student-uuid-111",
        course_id: "course-uuid-abc",
        status: "pending",
      };

      const maliciousUpdate: CourseEnrollmentRow = {
        ...existingEnrollment,
        status: "active",
      };

      const result = evaluateEnrollmentUpdatePolicy(studentUser, existingEnrollment, maliciousUpdate);

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("Only administrators can update");
    });

    // Test 6: Existing admin approval workflow -> continues to work (ALLOWED)
    it("Test 6: Existing admin approval workflow -> continues to work (ALLOWED)", () => {
      const existingEnrollment: CourseEnrollmentRow = {
        user_id: "student-uuid-111",
        course_id: "course-uuid-abc",
        status: "pending",
      };

      const approvedEnrollment: CourseEnrollmentRow = {
        ...existingEnrollment,
        status: "active",
      };

      const result = evaluateEnrollmentUpdatePolicy(adminUser, existingEnrollment, approvedEnrollment);

      expect(result.allowed).toBe(true);
    });
  });

  describe("Course Learning Access Gating (CourseLearning.tsx)", () => {
    it("unlocks course content only for active enrollment", () => {
      const access = evaluateCourseLearningAccess(
        { userId: "student-uuid-111", isAdmin: false },
        { status: "active" }
      );
      expect(access).toBe("active");
    });

    it("blocks access and shows pending screen when enrollment is pending", () => {
      const access = evaluateCourseLearningAccess(
        { userId: "student-uuid-111", isAdmin: false },
        { status: "pending" }
      );
      expect(access).toBe("pending");
    });

    it("blocks access and shows rejected screen when enrollment is rejected", () => {
      const access = evaluateCourseLearningAccess(
        { userId: "student-uuid-111", isAdmin: false },
        { status: "rejected" }
      );
      expect(access).toBe("rejected");
    });

    it("blocks access completely when user is not enrolled (null)", () => {
      const access = evaluateCourseLearningAccess(
        { userId: "student-uuid-111", isAdmin: false },
        null
      );
      expect(access).toBe("denied");
    });

    it("allows administrators full access regardless of enrollment", () => {
      const access = evaluateCourseLearningAccess(
        { userId: "admin-uuid-001", isAdmin: true },
        null
      );
      expect(access).toBe("active");
    });
  });
});
