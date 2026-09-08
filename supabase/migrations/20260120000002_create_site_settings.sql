-- Create a table for site settings (key-value store)
create table if not exists public.site_settings (
    key text primary key,
    value jsonb not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.site_settings enable row level security;

-- Policy: Allow read access to everyone
create policy "Allow public read access"
on public.site_settings for select
to public
using (true);

-- Policy: Allow all access to authenticated users (admins)
-- Assuming you check admin status in the app, or you can add a role check here
create policy "Allow authenticated insert/update"
on public.site_settings for all
to authenticated
using (true)
with check (true);


-- Create a storage bucket for site assets if it doesn't exist
-- Note: Creating buckets via SQL is supported in newer Supabase versions, 
-- but sometimes needs to be done via dashboard. We'll try here.
insert into storage.buckets (id, name, public)
values ('site_assets', 'site_assets', true)
on conflict (id) do nothing;

-- Storage policies for site_assets
create policy "Public Access"
on storage.objects for select
to public
using ( bucket_id = 'site_assets' );

create policy "Authenticated Upload"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'site_assets' );

create policy "Authenticated Update"
on storage.objects for update
to authenticated
using ( bucket_id = 'site_assets' );

create policy "Authenticated Delete"
on storage.objects for delete
to authenticated
using ( bucket_id = 'site_assets' );
