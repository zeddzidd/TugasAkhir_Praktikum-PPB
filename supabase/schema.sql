-- =============================================================================
-- ZedConsign: Supabase Database Schema & RLS Policies
-- =============================================================================

-- 1. Enable UUID Extension
create extension if not exists "uuid-ossp";

-- 2. Create Profiles Table (Linked to Supabase Auth)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  email text,
  phone text,
  avatar_url text,
  role text default 'consignor',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Create Shoes Catalog Table (Consignment Inventory)
create table if not exists public.shoes (
  id text primary key,
  name text not null,
  brand text not null,
  category text not null,
  size text not null,
  condition text not null,
  price numeric not null,
  image text,
  description text,
  consignor text,
  stock integer default 1,
  is_featured boolean default false,
  is_express boolean default false,
  user_id uuid references auth.users on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Enable Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.shoes enable row level security;

-- 5. Profiles Policies
create policy "Public profiles are viewable by everyone."
  on public.profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on public.profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on public.profiles for update
  using ( auth.uid() = id );

-- 6. Shoes Policies
create policy "Shoes catalog is viewable by everyone."
  on public.shoes for select
  using ( true );

create policy "Authenticated users can insert shoes."
  on public.shoes for insert
  with check ( auth.role() = 'authenticated' );

create policy "Users can update their shoes or public catalog."
  on public.shoes for update
  using ( auth.role() = 'authenticated' );

create policy "Users can delete their own shoes."
  on public.shoes for delete
  using ( auth.role() = 'authenticated' );

-- 7. Trigger to automatically create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email, phone)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email,
    new.raw_user_meta_data->>'phone'
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
