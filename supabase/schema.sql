-- =============================================================================
-- ZEDCONSIGN: SUPABASE DATABASE SCHEMA & INITIAL DATA
-- Copy dan paste seluruh skrip ini ke SQL Editor di Dashboard Supabase,
-- lalu klik tombol "Run".
-- =============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Buat Tabel Profiles (Terkoneksi langsung ke Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'consignor',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Buat Tabel Shoes (Katalog Sepatu & Inventaris Titip Jual dengan Dukungan 8 Foto)
CREATE TABLE IF NOT EXISTS public.shoes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  colorway TEXT,
  brand TEXT NOT NULL,
  category TEXT NOT NULL,
  size TEXT NOT NULL,
  condition TEXT NOT NULL,
  price NUMERIC NOT NULL,
  image TEXT,
  images TEXT[] DEFAULT '{}',
  description TEXT,
  consignor TEXT DEFAULT 'ZedConsign Verified Seller',
  stock INTEGER DEFAULT 1,
  is_featured BOOLEAN DEFAULT false,
  is_express BOOLEAN DEFAULT false,
  user_id UUID REFERENCES auth.users ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Aktifkan Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shoes ENABLE ROW LEVEL SECURITY;

-- 5. Kebijakan Keamanan (Policies) untuk Profiles
DROP POLICY IF EXISTS "Profiles viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles viewable by everyone"
  ON public.profiles FOR SELECT
  USING ( true );

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK ( auth.uid() = id );

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING ( auth.uid() = id );

-- 6. Kebijakan Keamanan (Policies) untuk Shoes
DROP POLICY IF EXISTS "Shoes catalog viewable by everyone" ON public.shoes;
CREATE POLICY "Shoes catalog viewable by everyone"
  ON public.shoes FOR SELECT
  USING ( true );

DROP POLICY IF EXISTS "Anyone can insert shoes" ON public.shoes;
CREATE POLICY "Anyone can insert shoes"
  ON public.shoes FOR INSERT
  WITH CHECK ( true );

DROP POLICY IF EXISTS "Anyone can update shoes" ON public.shoes;
CREATE POLICY "Anyone can update shoes"
  ON public.shoes FOR UPDATE
  USING ( true );

DROP POLICY IF EXISTS "Anyone can delete shoes" ON public.shoes;
CREATE POLICY "Anyone can delete shoes"
  ON public.shoes FOR DELETE
  USING ( true );

-- 7. Trigger Otomatis: Buat Profil saat User Baru Mendaftar di Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    COALESCE(new.raw_user_meta_data->>'phone', '')
  )
  ON CONFLICT (id) DO UPDATE
  SET full_name = EXCLUDED.full_name,
      updated_at = timezone('utc'::text, now());
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 8. Seed Data Awal (Koleksi Sepatu Autentik ZedConsign Lengkap dengan Detail Multi-Foto)
INSERT INTO public.shoes (id, name, colorway, brand, category, size, condition, price, image, images, description, consignor, stock, is_featured, is_express)
VALUES
  (
    'shoe-shox',
    'Nike Shox Z Calistra',
    'SHOX Z CALISTRA',
    'Nike',
    'Sneakers',
    'US 7W / EU 38',
    'Brand New In Box (BNIB)',
    2899000,
    '/shoes/shox-calistra.svg',
    ARRAY['/shoes/shox-calistra.svg', '/shoes/goadome-foam.svg', '/shoes/dunk-low.svg', '/shoes/jordan-retro.svg'],
    'Siluet hybrid Mary Jane futuristik ikonik dari lini Nike Shox. Mengombinasikan patent leather upper dengan buckle strap adjustable, diamond textured tooling, dan twin heel Shox column pods berventilasi udara.',
    'ZedConsign Vault',
    4,
    true,
    true
  ),
  (
    'shoe-0',
    'Nike Air Max Goadome Low Foam',
    'SP GREEN GOBLIN',
    'Nike',
    'Sneakers',
    'US 9 / EU 42.5',
    'Brand New In Box (BNIB)',
    3299000,
    '/shoes/goadome-foam.svg',
    ARRAY['/shoes/goadome-foam.svg', '/shoes/shox-calistra.svg', '/shoes/new-balance.svg', '/shoes/yeezy-boost.svg'],
    'Siluet rugged futuristik Nike Air Max Goadome Low Foam dalam colorway ikonik SP Green Goblin. Mengombinasikan molded metallic foam upper bertekstur wave dengan visible full-length Air-Sole unit dan rugged all-terrain lug outsole.',
    'ZedConsign Vault',
    3,
    true,
    true
  ),
  (
    'shoe-1',
    'Air Jordan 1 High OG Chicago Lost & Found',
    'VARSITY RED / BLACK / SAIL',
    'Jordan',
    'Basketball',
    'US 9 / EU 42.5',
    'Brand New In Box (BNIB)',
    4850000,
    '/shoes/jordan-retro.svg',
    ARRAY['/shoes/jordan-retro.svg', '/shoes/travis-scott.svg', '/shoes/dunk-low.svg', '/shoes/shox-calistra.svg'],
    'Ikonik sneaker legendaris dengan siluet high-top klasik colorway Chicago merah putih. Dilengkapi vintage aged midsole, crackled leather collar, dan receipt retro 1986. 100% Original Authentic verified by ZedConsign legit check.',
    'Zed Store Official',
    2,
    true,
    true
  ),
  (
    'shoe-2',
    'Nike Dunk Low Retro White Black Panda',
    'WHITE / BLACK PANDA',
    'Nike',
    'Sneakers',
    'US 8.5 / EU 42',
    'Brand New In Box (BNIB)',
    1850000,
    '/shoes/dunk-low.svg',
    ARRAY['/shoes/dunk-low.svg', '/shoes/samba-og.svg', '/shoes/jordan-retro.svg', '/shoes/new-balance.svg'],
    'Siluet paling populer dan versatile untuk daily wear. Kombinasi warna clean monochrome hitam dan putih dengan premium leather upper dan outsole karet berdaya cengkeram tinggi.',
    'Consignor #4102',
    5,
    true,
    true
  ),
  (
    'shoe-3',
    'Yeezy Boost 350 V2 Beluga Reflective',
    'BELUGA / STEEPLE GREY / SOLAR RED',
    'Adidas',
    'Running',
    'US 9.5 / EU 43',
    'Like New (VNDS 9.8/10)',
    3600000,
    '/shoes/yeezy-boost.svg',
    ARRAY['/shoes/yeezy-boost.svg', '/shoes/new-balance.svg', '/shoes/samba-og.svg', '/shoes/dunk-low.svg'],
    'Desain futuristik dari lini Yeezy dengan Primeknit upper berbenang reflective, pull-tab oranye khas Beluga, dan midsole Boost berbalut ribbed cage TPU yang sangat empuk.',
    'Consignor #1401',
    1,
    true,
    false
  ),
  (
    'shoe-4',
    'New Balance 990v5 Made in USA Grey',
    'CASTLEROCK / GREY',
    'New Balance',
    'Casual',
    'US 9 / EU 42.5',
    'Brand New In Box (BNIB)',
    3950000,
    '/shoes/new-balance.svg',
    ARRAY['/shoes/new-balance.svg', '/shoes/samba-og.svg', '/shoes/goadome-foam.svg', '/shoes/yeezy-boost.svg'],
    'Definisi kenyamanan dan kemewahan understated sneaker dad shoe. Dibuat di Amerika Serikat dengan material pigskin suede premium, breathable mesh, dan teknologi bantalan ENCAP.',
    'Zed Vault',
    3,
    false,
    true
  ),
  (
    'shoe-5',
    'Adidas Samba OG Cloud White Core Black',
    'CLOUD WHITE / CORE BLACK / GUM',
    'Adidas',
    'Casual',
    'US 8 / EU 41',
    'Brand New In Box (BNIB)',
    2150000,
    '/shoes/samba-og.svg',
    ARRAY['/shoes/samba-og.svg', '/shoes/dunk-low.svg', '/shoes/new-balance.svg', '/shoes/shox-calistra.svg'],
    'Klasik sepak bola era 1950 yang kini menjadi siluet street-style paling dicari di dunia. Suede T-toe overlay, 3-stripes hitam kontras, dan sol karet gum bernuansa vintage.',
    'Consignor #4108',
    4,
    false,
    true
  ),
  (
    'shoe-6',
    'Travis Scott x Air Jordan 1 Low Mocha',
    'SAIL / UNIVERSITY RED / RIDGEROCK',
    'Jordan',
    'Sneakers',
    'US 10 / EU 44',
    'Brand New In Box (BNIB)',
    18500000,
    '/shoes/travis-scott.svg',
    ARRAY['/shoes/travis-scott.svg', '/shoes/jordan-retro.svg', '/shoes/dunk-low.svg', '/shoes/yeezy-boost.svg'],
    'Holy Grail kolaborasi Travis Scott x Jordan Brand. Menampilkan reverse oversized Swoosh warna sail, suede nubuck cokelat mocha kaya serat, dan signature Cactus Jack embroidery merah di tumit.',
    'Zed Collector Consignment',
    1,
    true,
    false
  )
ON CONFLICT (id) DO NOTHING;
