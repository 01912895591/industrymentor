CREATE OR REPLACE FUNCTION public.course_on_purchase_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  c_id uuid;
BEGIN
  IF NEW.item_type = 'course' THEN
    SELECT id INTO c_id FROM public.courses WHERE slug = NEW.item_key LIMIT 1;
    IF c_id IS NOT NULL THEN
      INSERT INTO public.course_enrollments (user_id, course_id, purchase_id)
      VALUES (NEW.user_id, c_id, NEW.id)
      ON CONFLICT (user_id, course_id) DO UPDATE SET purchase_id = EXCLUDED.purchase_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_course_on_purchase_insert ON public.purchases;
CREATE TRIGGER trg_course_on_purchase_insert
AFTER INSERT ON public.purchases
FOR EACH ROW
EXECUTE FUNCTION public.course_on_purchase_insert();