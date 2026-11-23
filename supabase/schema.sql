-- =============================================================================
-- ZEDCONSIGN: DATABASE TABEL LANGSUNG (DIRECT TABLE STORAGE)
-- Tanpa ketergantungan Supabase Auth & Bebas Error Email Rate Limit
-- Jalankan SELURUH skrip ini di SQL Editor Supabase, lalu klik "Run".
-- =============================================================================

-- 1. Hapus tabel lama jika ada agar bersih dan fresh
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.shoes CASCADE;

-- 2. Buat Tabel USERS (Data pendaftaran akun aplikasi langsung masuk ke sini!)
CREATE TABLE public.users (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  password TEXT,
  role TEXT DEFAULT 'consignor',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Buat Tabel PROFILES (Sebagai mirror / cadangan data profil pengguna)
CREATE TABLE public.profiles (
  id TEXT PRIMARY KEY,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'consignor',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Buat Tabel SHOES (Katalog Sepatu & Inventaris Titip Jual dengan Dukungan Multi-Foto)
CREATE TABLE public.shoes (
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

-- 5. Nonaktifkan Row Level Security (RLS) agar semua operasi INSERT / SELECT / UPDATE
-- dari aplikasi web berjalan 100% mulus tanpa diblokir oleh Supabase
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.shoes DISABLE ROW LEVEL SECURITY;

-- 6. Berikan Hak Akses Penuh ke Semua Role (Anon, Authenticated, Postgres)
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role, postgres;
GRANT ALL ON TABLE public.users TO anon, authenticated, service_role, postgres;
GRANT ALL ON TABLE public.profiles TO anon, authenticated, service_role, postgres;
GRANT ALL ON TABLE public.shoes TO anon, authenticated, service_role, postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role, postgres;

-- 7. Masukkan Akun Demo Mahasiswa (Langsung tersimpan di Supabase!)
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
  )
ON CONFLICT (id) DO UPDATE
SET full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone;

-- 8. Masukkan Data Katalog Awal Sepatu ZedConsign (Lengkap 7 Sepatu dengan Detail Foto)
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
    'Nike Dunk Low Retro Panda',
    'WHITE / BLACK',
    'Nike',
    'Sneakers',
    'US 9 / EU 42.5',
    'Brand New In Box (BNIB)',
    1899000,
    '/shoes/dunk-low.svg',
    ARRAY['/shoes/dunk-low.svg', '/shoes/jordan-retro.svg', '/shoes/goadome-foam.svg', '/shoes/samba-og.svg'],
    'Sneakers terpopuler dengan kombinasi warna hitam-putih klasik. Menggunakan material leather premium yang nyaman dipakai sehari-hari.',
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
    'Ikon sneakers basket sepanjang masa warna legendaris Chicago Bulls 1985. Menggunakan premium full-grain leather dengan detail Wings logo klasik.',
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
    'Sepatu warisan sepak bola retro Jerman dengan suede T-toe dan gum sole khas. Sangat populer untuk tampilan street style kontemporer.',
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
    'Koleksi flagship Made in USA dengan bantalan FuelCell responsif dan ENCAP midsole. Standar kenyamanan harian tertinggi.',
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
    'Desain revolusioner karya Kanye West dengan upper Primeknit bergaris zebra dan midsole berteknologi Boost ultra empuk.',
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
    'Holy Grail kolaborasi Travis Scott x Jordan Brand. Menampilkan reverse oversized Swoosh warna sail, suede nubuck cokelat mocha kaya serat, dan signature Cactus Jack embroidery merah di tumit.',
    'Zed Collector Consignment',
    1,
    true,
    false
  )
ON CONFLICT (id) DO NOTHING;

-- 9. Refresh API Cache PostgREST
NOTIFY pgrst, 'reload schema';
