-- RPC: Update logo (admin-only)
create or replace function update_logo(new_logo_url text)
returns void
language plpgsql
security definer
as $$
begin
  -- Check admin permission
  if not exists (
    select 1 from public.user_roles ur
    where ur.user_id = auth.uid() and ur.role = 'admin'
  ) then
    raise exception 'Access denied: only admins can update logo';
  end if;

  -- Update logo URL
  update public.site_settings
  set logo_url = new_logo_url,
      updated_at = now()
  where id = '00000000-0000-0000-0000-000000000001';
end;
$$;
