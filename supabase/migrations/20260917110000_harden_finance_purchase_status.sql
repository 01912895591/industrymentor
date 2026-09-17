-- ====================================================================
-- INDUSTRYMENTOR: HARDEN FINANCE TRANSACTION INTEGRITY
-- Migration Version: 20260917110000_harden_finance_purchase_status
--
-- Objective:
-- Ensure financial income is recorded ONLY when a purchase is verified
-- and transitioned to 'completed'. Pending or failed checkouts must NOT
-- produce premature financial income records.
--
-- Mechanics:
-- 1. Remove legacy trigger `trg_finance_on_purchase_insert` from public.purchases.
-- 2. Create partial unique index on public.finance_transactions(purchase_id)
--    to mathematically guarantee idempotency and prevent duplicate records.
-- 3. Create status-based trigger function `public.finance_on_purchase_status()`.
-- 4. Create trigger `trg_finance_on_purchase_status` on public.purchases
--    firing AFTER INSERT OR UPDATE OF status FOR EACH ROW.
-- ====================================================================

-- 1. REMOVE LEGACY FINANCE INSERT TRIGGER
DROP TRIGGER IF EXISTS trg_finance_on_purchase_insert ON public.purchases;

-- 2. IDEMPOTENCY: CREATE UNIQUE PARTIAL INDEX ON PURCHASE_ID
-- Guarantees that at most ONE finance income transaction can ever be linked to any purchase.
CREATE UNIQUE INDEX IF NOT EXISTS idx_finance_txn_purchase_id
ON public.finance_transactions(purchase_id)
WHERE purchase_id IS NOT NULL;

-- 3. CREATE STATUS-BASED FINANCE TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION public.finance_on_purchase_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Record income ONLY when status is 'completed' (or legacy 'active')
  IF NEW.status IN ('completed', 'active') THEN
    -- Check if a finance record already exists for this purchase to maintain idempotency
    IF NOT EXISTS (
      SELECT 1 
      FROM public.finance_transactions 
      WHERE purchase_id = NEW.id
    ) THEN
      BEGIN
        INSERT INTO public.finance_transactions (
          txn_type,
          amount_cents,
          note,
          purchase_id,
          user_id
        ) VALUES (
          'income'::public.finance_txn_type,
          NEW.amount_cents,
          NEW.title,
          NEW.id,
          NEW.user_id
        );
      EXCEPTION
        WHEN unique_violation THEN
          -- Concurrency safety: if a nearly simultaneous transaction inserted the record, safely ignore
          NULL;
      END;
    END IF;
  END IF;

  -- For 'pending', 'failed', 'rejected', or any other state: DO NOTHING (no income logged)
  RETURN NEW;
END;
$$;

-- 4. ATTACH NEW TRIGGER ON STATUS TRANSITION
DROP TRIGGER IF EXISTS trg_finance_on_purchase_status ON public.purchases;
CREATE TRIGGER trg_finance_on_purchase_status
AFTER INSERT OR UPDATE OF status ON public.purchases
FOR EACH ROW
EXECUTE FUNCTION public.finance_on_purchase_status();
