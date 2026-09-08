-- Drop existing table if it has wrong schema
drop table if exists public.site_settings cascade;

-- Create site_settings table for storing favicon, logo, and other site-wide settings
create table public.site_settings (
  id uuid primary key default gen_random_uuid(),
  favicon_url text,
  logo_url text,
  updated_at timestamptz default now()
);

-- Insert default row (only one row should exist)
insert into public.site_settings (id, favicon_url, logo_url, updated_at)
values ('00000000-0000-0000-0000-000000000001', null, null, now());

-- Enable RLS
alter table public.site_settings enable row level security;

-- Policy: Everyone can read site settings
create policy "Anyone can view site settings"
on public.site_settings for select
to public
using (true);

-- Policy: Only admins can update site settings
create policy "Only admins can update site settings"
on public.site_settings for update
to authenticated
using (
  exists (
    select 1 from public.user_roles ur
    where ur.user_id = auth.uid() and ur.role = 'admin'
  )
);

-- RPC: Get site settings (public access)
create or replace function get_site_settings()
returns json
language plpgsql
security definer
as $$
begin
  return (
    select json_build_object(
      'favicon_url', favicon_url,
      'logo_url', logo_url,
      'updated_at', updated_at
    )
    from public.site_settings
    where id = '00000000-0000-0000-0000-000000000001'
    limit 1
  );
end;
$$;

-- RPC: Update favicon (admin-only)
create or replace function update_favicon(icon_url text)
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
    raise exception 'Access denied: only admins can update favicon';
  end if;

  -- Update favicon URL
  update public.site_settings
  set favicon_url = icon_url,
      updated_at = now()
  where id = '00000000-0000-0000-0000-000000000001';
end;
$$;

-- Create storage bucket for site assets (if not exists)
insert into storage.buckets (id, name, public)
values ('site-assets', 'site-assets', true)
on conflict (id) do nothing;

-- Storage policy: Anyone can view site-assets
create policy "Public Access to site-assets"
on storage.objects for select
to public
using (bucket_id = 'site-assets');

-- Storage policy: Only admins can upload to site-assets
create policy "Admin Upload to site-assets"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'site-assets' and
  exists (
    select 1 from public.user_roles ur
    where ur.user_id = auth.uid() and ur.role = 'admin'
  )
);

-- Storage policy: Only admins can delete from site-assets
create policy "Admin Delete from site-assets"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'site-assets' and
  exists (
    select 1 from public.user_roles ur
    where ur.user_id = auth.uid() and ur.role = 'admin'
  )
);
