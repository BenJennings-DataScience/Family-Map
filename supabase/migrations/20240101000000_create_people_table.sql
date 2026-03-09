-- Create people table
create table if not exists public.people (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  relationship text not null default 'Family',
  email text,
  phone text,
  birthday date,
  bio text,
  address text,
  latitude double precision,
  longitude double precision,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create photos table
create table if not exists public.photos (
  id uuid default gen_random_uuid() primary key,
  url text not null,
  caption text,
  person_id uuid references public.people(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table public.people enable row level security;
alter table public.photos enable row level security;

-- Allow all operations (tighten with auth later)
create policy "Allow all on people" on public.people
  for all using (true) with check (true);

create policy "Allow all on photos" on public.photos
  for all using (true) with check (true);

-- Storage buckets
insert into storage.buckets (id, name, public)
  values ('avatars', 'avatars', true)
  on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
  values ('photos', 'photos', true)
  on conflict (id) do nothing;

-- Storage policies for avatars
create policy "Public read avatars" on storage.objects
  for select using (bucket_id = 'avatars');

create policy "Upload avatars" on storage.objects
  for insert with check (bucket_id = 'avatars');

create policy "Update avatars" on storage.objects
  for update using (bucket_id = 'avatars');

create policy "Delete avatars" on storage.objects
  for delete using (bucket_id = 'avatars');

-- Storage policies for photos
create policy "Public read photos" on storage.objects
  for select using (bucket_id = 'photos');

create policy "Upload photos" on storage.objects
  for insert with check (bucket_id = 'photos');

create policy "Update photos" on storage.objects
  for update using (bucket_id = 'photos');

create policy "Delete photos" on storage.objects
  for delete using (bucket_id = 'photos');
