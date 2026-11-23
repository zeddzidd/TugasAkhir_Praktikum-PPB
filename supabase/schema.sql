-- =============================================================================
-- ZEDCONSIGN: DATABASE TABEL LANGSUNG DENGAN KEBIJAKAN AKSES PENUH
-- Kompatibel 100% dengan RLS Supabase (Tidak akan ada penolakan keamanan)
-- Jalankan SELURUH skrip ini di SQL Editor Supabase, lalu klik "Run".
-- =============================================================================

-- 1. Buat Tabel USERS jika belum ada
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  password TEXT,
  role TEXT DEFAULT 'consignor',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Buat Tabel PROFILES jika belum ada
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'consignor',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Buat Tabel SHOES jika belum ada
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Aktifkan RLS dan Berikan Akses Terbuka Penuh (All Operations Permitted)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for users" ON public.users;
CREATE POLICY "Allow all for users" ON public.users
  FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for profiles" ON public.profiles;
CREATE POLICY "Allow all for profiles" ON public.profiles
  FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for shoes" ON public.shoes;
CREATE POLICY "Allow all for shoes" ON public.shoes
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 5. Berikan Hak Akses Penuh ke Semua Role API Supabase
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role, postgres;
GRANT ALL ON TABLE public.users TO anon, authenticated, service_role, postgres;
GRANT ALL ON TABLE public.profiles TO anon, authenticated, service_role, postgres;
GRANT ALL ON TABLE public.shoes TO anon, authenticated, service_role, postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role, postgres;

-- 6. Masukkan Akun Shiddiq Yazid dan Akun OCO
INSERT INTO public.users (id, full_name, email, phone, password, role)
VALUES
  (
    'usr_shiddiq_yazid_41',
    'Shiddiq Yazid Nurhakim',
    'shiddiqyazidn29@gmail.com',
    '081234567890',
    'password123',
    'admin'
  ),
  (
    'usr_shiddiq_main',
    'Shiddiq Yazid',
    'shiddiqyazidn@gmail.com',
    '081234567890',
    'password123',
    'consignor'
  ),
  (
    'usr_oco_ganteng',
    'oco',
    'ocoganteng@gmail.com',
    '08999111',
    'password123',
    'consignor'
  )
ON CONFLICT (id) DO UPDATE
SET full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    password = EXCLUDED.password;

INSERT INTO public.profiles (id, full_name, email, phone)
VALUES
  (
    'usr_shiddiq_yazid_41',
    'Shiddiq Yazid Nurhakim',
    'shiddiqyazidn29@gmail.com',
    '081234567890'
  ),
  (
    'usr_shiddiq_main',
    'Shiddiq Yazid',
    'shiddiqyazidn@gmail.com',
    '081234567890'
  ),
  (
    'usr_oco_ganteng',
    'oco',
    'ocoganteng@gmail.com',
    '08999111'
  )
ON CONFLICT (id) DO UPDATE
SET full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone;

-- 7. Masukkan Seluruh 7 Katalog Sepatu Awal ZedConsign
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
    'Siluet hybrid Mary Jane futuristik ikonik dari lini Nike Shox.',
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
    'Siluet rugged futuristik Nike Air Max Goadome Low Foam dalam colorway ikonik SP Green Goblin.',
    'ZedConsign Vault',
    3,
    true,
    true
  ),
  (
    'shoe-1',
    'Nike Dunk Low Retro Panda',
    'WHITE / BLACK',
    'Nike',
    'Sneakers',
    'US 9 / EU 42.5',
    'Brand New In Box (BNIB)',
    1899000,
    '/shoes/dunk-low.svg',
    ARRAY['/shoes/dunk-low.svg', '/shoes/jordan-retro.svg', '/shoes/goadome-foam.svg', '/shoes/samba-og.svg'],
    'Sneakers terpopuler dengan kombinasi warna hitam-putih klasik.',
    'ZedConsign Verified Seller',
    5,
    true,
    true
  ),
  (
    'shoe-2',
    'Air Jordan 1 Retro High OG Chicago',
    'VARSITY RED / BLACK / WHITE',
    'Jordan',
    'Sneakers',
    'US 9.5 / EU 43',
    'Brand New In Box (BNIB)',
    4250000,
    '/shoes/jordan-retro.svg',
    ARRAY['/shoes/jordan-retro.svg', '/shoes/dunk-low.svg', '/shoes/shox-calistra.svg', '/shoes/travis-scott.svg'],
    'Ikon sneakers basket sepanjang masa warna legendaris Chicago Bulls 1985.',
    'Jakarta Vault Sneaker',
    2,
    true,
    false
  ),
  (
    'shoe-3',
    'Adidas Samba OG Cloud White Core Black',
    'CLOUD WHITE / CORE BLACK / CLEAR GRANITE',
    'Adidas',
    'Sneakers',
    'US 8.5 / EU 42',
    'Brand New In Box (BNIB)',
    1650000,
    '/shoes/samba-og.svg',
    ARRAY['/shoes/samba-og.svg', '/shoes/dunk-low.svg', '/shoes/new-balance.svg', '/shoes/goadome-foam.svg'],
    'Sepatu warisan sepak bola retro Jerman dengan suede T-toe.',
    'Bandung Sneakerhead Consignment',
    4,
    true,
    true
  ),
  (
    'shoe-4',
    'New Balance 990v6 MiUSA Grey',
    'CASTLEROCK / MARBLEHEAD',
    'New Balance',
    'Sneakers',
    'US 9 / EU 42.5',
    'Brand New In Box (BNIB)',
    3899000,
    '/shoes/new-balance.svg',
    ARRAY['/shoes/new-balance.svg', '/shoes/goadome-foam.svg', '/shoes/samba-og.svg', '/shoes/shox-calistra.svg'],
    'Koleksi flagship Made in USA dengan bantalan FuelCell.',
    'ZedConsign Verified Seller',
    3,
    true,
    false
  ),
  (
    'shoe-5',
    'Adidas Yeezy Boost 350 V2 Zebra',
    'WHITE / CORE BLACK / RED',
    'Adidas',
    'Sneakers',
    'US 9.5 / EU 43',
    'Brand New In Box (BNIB)',
    4850000,
    '/shoes/yeezy-boost.svg',
    ARRAY['/shoes/yeezy-boost.svg', '/shoes/dunk-low.svg', '/shoes/travis-scott.svg', '/shoes/jordan-retro.svg'],
    'Desain revolusioner karya Kanye West upper Primeknit bergaris zebra.',
    'Surabaya Vault Sneakers',
    2,
    true,
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
    'Holy Grail kolaborasi Travis Scott x Jordan Brand.',
    'Zed Collector Consignment',
    1,
    true,
    false
  )
ON CONFLICT (id) DO NOTHING;

-- 8. Refresh API Cache
NOTIFY pgrst, 'reload schema';
