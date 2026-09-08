-- FIX: Missing Phone Numbers in Admin Panel
-- Run this in your Supabase SQL Editor to update the get_pro_users_data function

create or replace function get_pro_users_data()
returns table (
  user_id uuid,
  full_name text,
  email text,
  phone text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  enrolled_courses jsonb
)
language plpgsql
security definer
as $$
begin
  -- Check admin permission
  if not exists (
    select 1 from public.user_roles ur
    where ur.user_id = auth.uid() and ur.role = 'admin'
  ) then
    raise exception 'Access denied';
  end if;

  return query
  select 
    au.id as user_id,
    p.full_name,
    au.email::text,
    coalesce(p.phone, au.phone::text) as phone, -- Try fetching from profiles first
    au.created_at,
    au.last_sign_in_at,
    coalesce(
      (
        select jsonb_agg(jsonb_build_object('id', c.id, 'title', c.title))
        from public.course_enrollments ce
        join public.courses c on c.id = ce.course_id
        where ce.user_id = au.id
      ),
      '[]'::jsonb
    ) as enrolled_courses
  from auth.users au
  left join public.profiles p on p.user_id = au.id
  order by au.created_at desc;
end;
$$;
