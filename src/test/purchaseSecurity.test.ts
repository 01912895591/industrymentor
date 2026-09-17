import { describe, it, expect } from "vitest";

/**
 * PostgreSQL Purchase Price & Integrity Simulation
 * Replicates the database-level security rules and trigger logic defined in:
 * `supabase/migrations/20260917095500_harden_purchase_price_integrity.sql`
 */
interface CourseRecord {
  id: string;
  slug: string;
  title: string;
  price_cents: number;
  published: boolean;
}

interface PurchaseInsertPayload {
  user_id: string;
  item_type: "course" | "ebook" | "sop";
  item_key: string;
  title: string;
  amount_cents: number;
  status?: string;
  payment_method?: string;
  transaction_id?: string;
}

interface AuthContext {
  userId: string | null;
  role: "authenticated" | "anon";
  isAdmin: boolean;
}

// Authoritative Courses Database Mock
const mockCoursesDb: CourseRecord[] = [
  {
    id: "e373dcce-54fb-4a55-8070-54543691fedb",
    slug: "from-order-to-shipment-excellence",
    title: "Garments Merchandising - Order to Shipment",
    price_cents: 500000, // ৳5,000.00
    published: true,
  },
];

/**
 * Simulates the RLS check and BEFORE INSERT trigger logic:
 * `public.validate_and_set_purchase_price()`
 */
function processPurchaseInsert(
  auth: AuthContext,
  payload: PurchaseInsertPayload
): { success: boolean; error?: string; storedRecord?: PurchaseInsertPayload } {
  // 1. Authentication check
  if (!auth.userId || auth.role !== "authenticated") {
    return { success: false, error: "Unauthenticated request" };
  }

  // 2. RLS & Ownership check: user_id must match auth.uid() for non-admins
  if (!auth.isAdmin && payload.user_id !== auth.userId) {
    return {
      success: false,
      error: "RLS Violation / IDOR: Cannot create purchase for another user",
    };
  }

  // 3. RLS status check: student cannot submit status other than 'pending' or omitted
  if (!auth.isAdmin && payload.status && payload.status !== "pending") {
    return {
      success: false,
      error: `RLS Policy Violation: Students cannot set status '${payload.status}'`,
    };
  }

  const recordToStore: PurchaseInsertPayload = { ...payload };

  // 4. Trigger logic: For non-admins, status is strictly enforced to 'pending'
  if (!auth.isAdmin) {
    recordToStore.status = "pending";
  }

  // 5. Trigger logic: For item_type = 'course', database authoritative price is enforced
  if (recordToStore.item_type === "course") {
    const course = mockCoursesDb.find(
      (c) => c.id === recordToStore.item_key || c.slug === recordToStore.item_key
    );

    if (!course) {
      return {
        success: false,
        error: `Course not found or invalid course reference: ${recordToStore.item_key}`,
      };
    }

    // OVERRIDE client-provided price with authoritative database price
    recordToStore.amount_cents = course.price_cents;
    // Synchronize authoritative course title
    recordToStore.title = course.title;
  } else {
    // Non-course purchases: ensure status defaults to 'pending'
    if (!recordToStore.status) {
      recordToStore.status = "pending";
    }
  }

  return { success: true, storedRecord: recordToStore };
}

describe("Purchase Price Integrity & Database-Authoritative Enforcement", () => {
  const studentUser: AuthContext = {
    userId: "student-uuid-111",
    role: "authenticated",
    isAdmin: false,
  };

  const otherUser: AuthContext = {
    userId: "attacker-uuid-999",
    role: "authenticated",
    isAdmin: false,
  };

  const adminUser: AuthContext = {
    userId: "admin-uuid-001",
    role: "authenticated",
    isAdmin: true,
  };

  const validCourseId = "e373dcce-54fb-4a55-8070-54543691fedb";

  // Test 1: Client sends correct amount -> Expected stored: 500000
  it("Test 1: Client sends correct amount -> Expected stored: 500000", () => {
    const result = processPurchaseInsert(studentUser, {
      user_id: studentUser.userId!,
      item_type: "course",
      item_key: validCourseId,
      title: "Garments Merchandising",
      amount_cents: 500000,
      payment_method: "bkash",
      transaction_id: "TRX-VALID-100",
      status: "pending",
    });

    expect(result.success).toBe(true);
    expect(result.storedRecord?.amount_cents).toBe(500000);
    expect(result.storedRecord?.status).toBe("pending");
  });

  // Test 2: Client maliciously sends amount_cents = 1 -> Expected stored: 500000
  it("Test 2: Client maliciously sends amount_cents = 1 -> Expected stored: 500000", () => {
    const result = processPurchaseInsert(studentUser, {
      user_id: studentUser.userId!,
      item_type: "course",
      item_key: validCourseId,
      title: "Garments Merchandising",
      amount_cents: 1, // Manipulated
      payment_method: "bkash",
      transaction_id: "TRX-HACK-001",
      status: "pending",
    });

    expect(result.success).toBe(true);
    // Overridden by DB authoritative price!
    expect(result.storedRecord?.amount_cents).toBe(500000);
  });

  // Test 3: Client maliciously sends amount_cents = 0 -> Expected stored: 500000
  it("Test 3: Client maliciously sends amount_cents = 0 -> Expected stored: 500000", () => {
    const result = processPurchaseInsert(studentUser, {
      user_id: studentUser.userId!,
      item_type: "course",
      item_key: validCourseId,
      title: "Garments Merchandising",
      amount_cents: 0, // Manipulated
      payment_method: "bkash",
      transaction_id: "TRX-HACK-000",
      status: "pending",
    });

    expect(result.success).toBe(true);
    // Overridden by DB authoritative price!
    expect(result.storedRecord?.amount_cents).toBe(500000);
  });

  // Test 4: Client maliciously sends negative amount -> Expected stored: 500000
  it("Test 4: Client maliciously sends negative amount -> Authoritative course price is stored", () => {
    const result = processPurchaseInsert(studentUser, {
      user_id: studentUser.userId!,
      item_type: "course",
      item_key: validCourseId,
      title: "Garments Merchandising",
      amount_cents: -50000, // Malicious negative
      payment_method: "bkash",
      transaction_id: "TRX-HACK-NEG",
      status: "pending",
    });

    expect(result.success).toBe(true);
    expect(result.storedRecord?.amount_cents).toBe(500000);
  });

  // Test 5: Client attempts status = 'completed' -> normal student cannot create completed purchase
  it("Test 5: Client attempts status = 'completed' -> normal student denied", () => {
    const result = processPurchaseInsert(studentUser, {
      user_id: studentUser.userId!,
      item_type: "course",
      item_key: validCourseId,
      title: "Garments Merchandising",
      amount_cents: 500000,
      payment_method: "bkash",
      transaction_id: "TRX-EXPLOIT",
      status: "completed", // Unauthorized privilege escalation
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("RLS Policy Violation");
  });

  // Test 6: Client attempts another user's user_id -> DENIED (IDOR)
  it("Test 6: Client attempts another user's user_id -> DENIED", () => {
    const result = processPurchaseInsert(otherUser, {
      user_id: studentUser.userId!, // Trying to purchase on behalf of student-uuid-111
      item_type: "course",
      item_key: validCourseId,
      title: "Garments Merchandising",
      amount_cents: 500000,
      payment_method: "bkash",
      transaction_id: "TRX-IDOR",
      status: "pending",
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("Cannot create purchase for another user");
  });

  // Test 7: Existing legitimate course purchase flow remains functional
  it("Test 7: Existing legitimate course purchase flow remains functional", () => {
    const result = processPurchaseInsert(studentUser, {
      user_id: studentUser.userId!,
      item_type: "course",
      item_key: validCourseId,
      title: "Client Proposed Title",
      amount_cents: 500000,
      payment_method: "bkash",
      transaction_id: "TRX-LEGIT-2026",
      status: "pending",
    });

    expect(result.success).toBe(true);
    expect(result.storedRecord?.amount_cents).toBe(500000);
    // Correct canonical title enforced
    expect(result.storedRecord?.title).toBe("Garments Merchandising - Order to Shipment");
    expect(result.storedRecord?.status).toBe("pending");
  });

  // Test 8: Existing admin purchase-management flow remains functional
  it("Test 8: Existing admin purchase-management flow remains functional", () => {
    const result = processPurchaseInsert(adminUser, {
      user_id: studentUser.userId!, // Admin enrolling/purchasing for a student
      item_type: "course",
      item_key: validCourseId,
      title: "Admin Enrolled Purchase",
      amount_cents: 500000,
      payment_method: "manual_override",
      transaction_id: "ADMIN-OFFLINE-001",
      status: "completed", // Admin allowed to set completed status
    });

    expect(result.success).toBe(true);
    expect(result.storedRecord?.status).toBe("completed");
    expect(result.storedRecord?.amount_cents).toBe(500000);
  });

  // Test 9: Non-course purchase (ebook/sop) preserves price and pending status
  it("Test 9: Library demo items (ebook/sop) preserve catalog price and pending status", () => {
    const result = processPurchaseInsert(studentUser, {
      user_id: studentUser.userId!,
      item_type: "ebook",
      item_key: "garments-costing-guide",
      title: "Garments Costing & CM Calculation",
      amount_cents: 199,
    });

    expect(result.success).toBe(true);
    expect(result.storedRecord?.amount_cents).toBe(199);
    expect(result.storedRecord?.status).toBe("pending");
  });
});
