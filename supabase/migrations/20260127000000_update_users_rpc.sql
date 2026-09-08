-- Enable deleting users by ID (restricted to admins via RLS/wrapper)
-- Drop first because we are renaming the input parameter
drop function if exists delete_user_by_id(uuid);

create or replace function delete_user_by_id(_user_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  -- Check if the requesting user is an admin
  -- Fully qualify table aliases to prevent ambiguity
  if not exists (
    select 1 from public.user_roles ur
    where ur.user_id = auth.uid() and ur.role = 'admin'
  ) then
    raise exception 'Access denied: only admins can delete users';
  end if;

  -- Delete from auth.users
  delete from auth.users where id = _user_id;
end;
$$;

-- Enhanced user data fetcher
-- Drop first because the previous creation might have succeeded with a different signature or to ensure clean slate
drop function if exists get_pro_users_data();

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
    au.phone::text,
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
