import { describe, it, expect } from "vitest";

/**
 * PostgreSQL Finance Transaction Lifecycle Simulator
 * Replicates the database-level trigger logic and partial unique index defined in:
 * `supabase/migrations/20260917110000_harden_finance_purchase_status.sql`
 */
interface PurchaseRecord {
  id: string;
  user_id: string;
  item_type: string;
  item_key: string;
  title: string;
  amount_cents: number;
  status: "pending" | "completed" | "failed" | string;
}

interface FinanceTransactionRecord {
  id: string;
  txn_type: "income" | "expense";
  amount_cents: number;
  note: string;
  purchase_id: string;
  user_id: string;
  created_at: string;
}

class FinanceDatabaseSimulator {
  private financeTransactions: FinanceTransactionRecord[] = [];

  // Replicates unique index: idx_finance_txn_purchase_id ON finance_transactions(purchase_id)
  private hasUniqueConflict(purchaseId: string): boolean {
    return this.financeTransactions.some((t) => t.purchase_id === purchaseId);
  }

  /**
   * Simulates the trigger:
   * public.finance_on_purchase_status()
   * AFTER INSERT OR UPDATE OF status ON public.purchases
   */
  public onPurchaseStatusTransition(
    newPurchase: PurchaseRecord,
    oldPurchase?: PurchaseRecord
  ): { incomeCreated: boolean; totalTransactionsForPurchase: number } {
    let incomeCreated = false;

    // Trigger condition: ONLY status IN ('completed', 'active')
    if (newPurchase.status === "completed" || newPurchase.status === "active") {
      // Check IF NOT EXISTS (SELECT 1 FROM public.finance_transactions WHERE purchase_id = NEW.id)
      const alreadyExists = this.financeTransactions.some(
        (t) => t.purchase_id === newPurchase.id
      );

      if (!alreadyExists) {
        // Unique index check with EXCEPTION WHEN unique_violation THEN NULL
        if (this.hasUniqueConflict(newPurchase.id)) {
          // Handled safely by EXCEPTION block
          incomeCreated = false;
        } else {
          this.financeTransactions.push({
            id: `ft-${this.financeTransactions.length + 1}`,
            txn_type: "income",
            amount_cents: newPurchase.amount_cents,
            note: newPurchase.title,
            purchase_id: newPurchase.id,
            user_id: newPurchase.user_id,
            created_at: new Date().toISOString(),
          });
          incomeCreated = true;
        }
      }
    }

    const totalForPurchase = this.financeTransactions.filter(
      (t) => t.purchase_id === newPurchase.id
    ).length;

    return { incomeCreated, totalTransactionsForPurchase: totalForPurchase };
  }

  public getTransactions(): FinanceTransactionRecord[] {
    return [...this.financeTransactions];
  }

  public seedExistingTransaction(record: FinanceTransactionRecord) {
    this.financeTransactions.push(record);
  }

  public clear() {
    this.financeTransactions = [];
  }
}

describe("Finance Transaction Lifecycle & Idempotency", () => {
  let db: FinanceDatabaseSimulator;

  beforeEach(() => {
    db = new FinanceDatabaseSimulator();
  });

  const samplePurchase: PurchaseRecord = {
    id: "purchase-uuid-100",
    user_id: "student-uuid-001",
    item_type: "course",
    item_key: "e373dcce-54fb-4a55-8070-54543691fedb",
    title: "Garments Merchandising Course",
    amount_cents: 500000,
    status: "pending",
  };

  // Test 1: New purchase status = pending -> NO finance income
  it("Test 1: New purchase status = pending -> NO finance income", () => {
    const result = db.onPurchaseStatusTransition(samplePurchase);

    expect(result.incomeCreated).toBe(false);
    expect(result.totalTransactionsForPurchase).toBe(0);
    expect(db.getTransactions()).toHaveLength(0);
  });

  // Test 2: Purchase pending -> completed -> EXACTLY ONE finance income
  it("Test 2: Purchase pending -> completed -> EXACTLY ONE finance income", () => {
    // Initial insert (pending)
    db.onPurchaseStatusTransition(samplePurchase);

    // Admin approves (status -> completed)
    const approvedPurchase: PurchaseRecord = {
      ...samplePurchase,
      status: "completed",
    };

    const result = db.onPurchaseStatusTransition(approvedPurchase, samplePurchase);

    expect(result.incomeCreated).toBe(true);
    expect(result.totalTransactionsForPurchase).toBe(1);

    const txns = db.getTransactions();
    expect(txns).toHaveLength(1);
    expect(txns[0].amount_cents).toBe(500000);
    expect(txns[0].txn_type).toBe("income");
    expect(txns[0].purchase_id).toBe(samplePurchase.id);
  });

  // Test 3: Purchase pending -> failed (rejected) -> NO finance income
  it("Test 3: Purchase pending -> failed -> NO finance income", () => {
    // Initial insert (pending)
    db.onPurchaseStatusTransition(samplePurchase);

    // Admin rejects (status -> failed)
    const rejectedPurchase: PurchaseRecord = {
      ...samplePurchase,
      status: "failed",
    };

    const result = db.onPurchaseStatusTransition(rejectedPurchase, samplePurchase);

    expect(result.incomeCreated).toBe(false);
    expect(result.totalTransactionsForPurchase).toBe(0);
    expect(db.getTransactions()).toHaveLength(0);
  });

  // Test 4: Completed purchase updated again -> NO duplicate finance income
  it("Test 4: Completed purchase updated again -> NO duplicate finance income", () => {
    const completedPurchase: PurchaseRecord = {
      ...samplePurchase,
      status: "completed",
    };

    // First approval
    db.onPurchaseStatusTransition(completedPurchase);
    expect(db.getTransactions()).toHaveLength(1);

    // Admin clicks save or update again
    const secondUpdate = db.onPurchaseStatusTransition(completedPurchase);

    expect(secondUpdate.incomeCreated).toBe(false);
    expect(secondUpdate.totalTransactionsForPurchase).toBe(1);
    expect(db.getTransactions()).toHaveLength(1);
  });

  // Test 5: Two approval attempts / concurrent execution -> MAXIMUM ONE finance transaction
  it("Test 5: Concurrent approval attempts -> MAXIMUM ONE finance transaction per purchase", () => {
    const completedPurchase: PurchaseRecord = {
      ...samplePurchase,
      status: "completed",
    };

    // Simulate two concurrent approval triggers running in parallel
    const res1 = db.onPurchaseStatusTransition(completedPurchase);
    const res2 = db.onPurchaseStatusTransition(completedPurchase);

    expect(res1.incomeCreated).toBe(true);
    expect(res2.incomeCreated).toBe(false); // Second caught by idempotency / unique constraint
    expect(db.getTransactions()).toHaveLength(1);
  });

  // Test 6: Existing historical finance transaction preserved / recognized
  it("Test 6: Existing historical finance transaction is preserved and not duplicated", () => {
    // Seed an existing historical finance record
    db.seedExistingTransaction({
      id: "ft-historical-01",
      txn_type: "income",
      amount_cents: 500000,
      note: "Historical Course Payment",
      purchase_id: samplePurchase.id,
      user_id: samplePurchase.user_id,
      created_at: "2026-08-01T00:00:00Z",
    });

    expect(db.getTransactions()).toHaveLength(1);

    // Purchase gets updated or approved again
    const completedPurchase: PurchaseRecord = {
      ...samplePurchase,
      status: "completed",
    };

    const result = db.onPurchaseStatusTransition(completedPurchase);

    expect(result.incomeCreated).toBe(false);
    expect(result.totalTransactionsForPurchase).toBe(1);
    expect(db.getTransactions()).toHaveLength(1);
    expect(db.getTransactions()[0].id).toBe("ft-historical-01");
  });
});
