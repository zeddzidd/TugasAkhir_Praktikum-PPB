# ZedConsign: Aplikasi Katalog & Titip Jual Sepatu Berbasis Mobile (PWA)
> **Platform Mobile Progressive Web App (PWA) Konsinyasi Sneakers & Luxury Streetwear Terkurasi (Kick Avenue Inspired UI)**  
> Dikembangkan sebagai Tugas Akhir Praktikum Pemrograman Perangkat Bergerak (PPB) — Departemen Teknik Komputer, Fakultas Teknik, Universitas Diponegoro.

---

## 👨‍💻 Identitas Mahasiswa

* **Nama Lengkap**: Shiddiq Yazid Nurhakim
* **NIM**: 21120124140120
* **Kelompok**: Kelompok 41
* **Program Studi**: S1 Teknik Komputer
* **Departemen / Fakultas**: Teknik Komputer &mdash; Fakultas Teknik
* **Universitas**: Universitas Diponegoro (UNDIP)
* **Mata Kuliah**: Praktikum Pemrograman Perangkat Bergerak (PPB)
* **Repositori GitHub**: [https://github.com/zeddzidd/TugasAkhir_Praktikum-PPB.git](https://github.com/zeddzidd/TugasAkhir_Praktikum-PPB.git)

---

## 📌 Ringkasan Proyek

**ZedConsign** adalah aplikasi Progressive Web App (PWA) e-commerce dan konsinyasi (*titip jual*) sepatu sneakers original yang mengadopsi estetika desain marketplace luxury streetwear terkemuka (**Kick Avenue**). 

Aplikasi dirancang responsif untuk pengalaman pengguna ponsel pintar (*smartphone-first*), dilengkapi fungsionalitas offline penuh, instalasi aplikasi mandiri (*Add to Home Screen*), autentikasi pengguna, manajemen inventaris CRUD, kalkulator konsinyasi, serta sistem galeri multi-foto hingga 8 sudut verifikasi detail fisik sepatu.

---

## 🛠️ Stack Teknologi

* **Frontend Framework**: React 19 (JavaScript / JSX)
* **Build Tool & Bundler**: Vite 6+
* **Progressive Web App Engine**: `vite-plugin-pwa` dengan Workbox (Service Worker precaching & runtime caching)
* **Backend & Database**: Supabase (PostgreSQL, Supabase Auth, Row Level Security / RLS, Triggers)
* **Styling**: Vanilla CSS3 Modern (Custom Kick Avenue Theme: Obsidian Black `#0f172a`, Deep Emerald `#006b52` & `#00dfa2`, Typography Inter/SF Pro Display)
* **State & Persistence**: React Hooks (`useState`, `useEffect`, `useMemo`, `useRef`), Browser `localStorage`, dan sinkronisasi Cloud Supabase.

---

## ✨ Fitur & Pemenuhan Kriteria Tugas Akhir

| Kriteria Tugas Akhir | Status | Keterangan Implementasi pada ZedConsign |
| :--- | :---: | :--- |
| **Stack Sesuai Modul Praktikum** | ✅ | Menggunakan **React 19**, **Vite**, dan **vite-plugin-pwa** murni berbasis **JavaScript**. |
| **Minimal 3 Halaman Navigasi** | ✅ | Menyediakan **4 modul halaman**: Katalog Sepatu, Kelola Sepatu (CRUD), Titip Jual (Consign), dan Profil Pengguna. |
| **Halaman Profil Mahasiswa** | ✅ | Memuat data lengkap: **Nama, NIM, Kelompok 41, Prodi S1 Teknik Komputer, Fakultas Teknik UNDIP**, avatar, dan status tugas akhir. |
| **Halaman CRUD Fungsional** | ✅ | Operasi **Create** (tambah sepatu), **Read** (tabel inventaris & metrik stok), **Update** (edit data), dan **Delete** (hapus unit) tersimpan aman di `localStorage` dan tabel Supabase. |
| **PWA Installable & Offline Ready** | ✅ | Dilengkapi `manifest.webmanifest`, service worker cache, lencana offline otomatis, dan ikon monogram **ZC** baru. |
| **Deploy Ready** | ✅ | Dilengkapi konfigurasi `vercel.json` SPA rewrites dan build produksi bersih tanpa error. |

---

## 🌟 Fitur Unggulan Aplikasi

### 1. Desain & Antarmuka Luxury Streetwear (Kick Avenue Inspired)
- **Monogram Logo "ZC"**: Ikon vektor SVG dan PNG resolusi tinggi (192x192 & 512x512) dengan aksen obsidian dan emerald glow.
- **Header Responsif Mobile**: Logo, kolom pencarian dinamis, tombol *Masuk*, dan tombol *Daftar* tertata proporsional tanpa terpotong di layar HP (iPhone/Android).
- **Sub-Navigasi Horizontal**: Kategori *Redemption Center*, *⚡ Express Shipping*, *📦 Standard Shipping*, *Sneakers*, *Basketball*, *Casual*, dan *Luxury*.
- **Hero Banner Carousel (5 Slide Teratas)**: Animasi transisi halus, counter slide (`5/5`), navigasi panah (*chevrons*), dan dukungan *touch swipe* di layar ponsel.

### 2. Modal Detail Sepatu & Galeri Multi-Foto (Hingga 8 Foto)
- **Tampilan Galeri Produk**: Menampilkan hingga **8 foto detail** dari unit sepatu yang dijual.
- **Navigasi Foto Lengkap**: Tombol panah kiri/kanan, indikator titik (*dots*), lencana penghitung foto (*misal Foto 1 / 4*), serta barisan thumbnail strip interaktif di bawah foto utama.
- **Pilihan Ukuran Interaktif (Size Grid US / EU / UK / CM)**: Menghitung harga dinamis berdasarkan ukuran sepatu, lengkap dengan lencana *⚡ Express* dan *Best Price*.
- **Metode Pengiriman Adaptif**: Pilihan antara **⚡ Express Shipping** (1-2 hari kerja dari Vault, Rp 45.000) dan **📦 Standard Shipping** (3-5 hari kerja, Rp 20.000) dengan kalkulasi total harga langsung.
- **Fitur Tambahan**: Tombol *Share* salin tautan produk, toggle simpan favorit (*Bookmark*), pop-up *Size Chart Guide*, dan *Checkout Purchase Sheet*.

### 3. Formulir Titip Jual & Uploader 8 Foto
- **Multi-Photo Uploader**: Penjual dapat mengunggah hingga **8 foto** sekaligus melalui kamera HP, galeri file, drag & drop, preset siluet, atau URL eksternal.
- **Kompresi Otomatis**: Foto dikompresi otomatis via HTML5 Canvas (Base64 ringan) agar penyimpanan offline dan Supabase tetap cepat dan hemat kuota.
- **Rekomendasi 8 Sudut Verifikasi**:
  1. *Sisi Luar (Lateral)*
  2. *Sisi Dalam (Medial)*
  3. *Tampak Depan (Toe Box)*
  4. *Tampak Belakang (Heel & Logo)*
  5. *Sol Bawah (Outsole / Traction)*
  6. *Insole & Tag Ukuran*
  7. *Detail Jahitan & Tekstur Material*
  8. *Kotak / Box & Kelengkapan Ekstra*
- **Pengaturan Cover**: Foto pertama otomatis menjadi foto sampul (*Cover*), dengan opsi mengubah cover atau menghapus foto per-slot.
- **Kalkulator Titip Jual**: Menghitung otomatis potongan biaya jasa 5% transparan dan estimasi pencairan dana bersih.

### 4. Manajemen Inventaris & CRUD
- **Create**: Tambah model sepatu baru lengkap dengan galeri foto, ukuran, kondisi, harga, dan nama consignor.
- **Read**: Tabel inventaris dengan badge stok, kategori, ringkasan total nilai barang (*Inventory Valuation*), dan pencarian real-time.
- **Update**: Modal formulir pengeditan data unit yang sudah ada.
- **Delete**: Konfirmasi modal hapus unit sepatu.
- **Tombol Reset Default**: Mengembalikan data awal bawaan katalog sewaktu-waktu.

### 5. Integrasi Database Supabase & Offline Mock Auth
- Terhubung dengan Supabase Client di `src/lib/supabase.js`.
- Skrip database SQL lengkap di `supabase/schema.sql` (tabel `public.profiles` dan `public.shoes` dengan kolom array `images TEXT[]`).
- Dialog modal Login dan Registrasi interaktif.
- Mendukung *offline authentication mock*, sehingga pengguna tetap dapat login, register, dan bertransaksi saat koneksi internet terputus.

### 6. Customer Support Desk Widget
- Widget mengambang (*floating button*) hijau di pojok kanan bawah dengan opsi konsultasi konsinyasi, edukasi kurasi autentikasi, pengiriman express, dan direct link ke WhatsApp Customer Service.

---

## 📱 Struktur Halaman

```
ZedConsign App
├── Header (Logo ZC, Search Bar, Sub-Nav Strip, Auth Masuk/Daftar)
├── Offline Banner (Deteksi Status Jaringan Real-Time)
├── Main Content:
│   ├── [Tab: catalog] -> Beranda Katalog (Hero Carousel, Filter, 2-Col Shoe Cards, Modal Detail)
│   ├── [Tab: manage]  -> Kelola Inventaris CRUD (Metrik Stok, Filter Tabel, Tambah/Edit/Hapus)
│   ├── [Tab: consign] -> Formulir Titip Jual (4 Langkah, Kalkulator 5%, Upload 8 Foto)
│   └── [Tab: profile] -> Profil Mahasiswa (Identitas Shiddiq Yazid, Status Syarat TA, Logout)
├── Support Floating Widget (WhatsApp Help Desk)
├── Auth Modal (Login & Register Popup)
├── Mobile Bottom Navigation Bar (Home, CRUD, Sell, Profile)
└── Footer (Branding, Legal, & Informasi Layanan)
```

---

## 🚀 Panduan Instalasi & Menjalankan Proyek

### Prasyarat
* Node.js (versi 18 ke atas disarankan)
* npm atau yarn / pnpm

### 1. Kloning Repositori
```bash
git clone https://github.com/zeddzidd/TugasAkhir_Praktikum-PPB.git
cd TugasAkhir_Praktikum-PPB
```

### 2. Instal Dependensi
```bash
npm install
```

### 3. Konfigurasi Lingkungan (Opsional)
Salin berkas `.env.example` menjadi `.env` jika ingin menghubungkan dengan project Supabase milik Anda:
```bash
cp .env.example .env
```
Isi variabel dengan kredensial Supabase Anda:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```
*(Catatan: Tanpa Supabase pun, aplikasi tetap berjalan 100% sempurna menggunakan LocalStorage fallback).*

### 4. Menjalankan Server Development
```bash
npm run dev
```
Server Vite akan aktif pada:
* **Lokal Laptop**: `http://localhost:5173/`
* **Jaringan Wi-Fi (Bisa dibuka di HP)**: `http://<IP_LAPTOP>:5173/` (contoh: `http://192.168.11.212:5173/`)

### 5. Membangun Berkas Produksi (Production Build)
```bash
npm run build
```
Hasil build akan berada di direktori `dist/` siap didistribusikan.

### 6. Menjalankan Pratinjau Build Produksi
```bash
npm run preview
```

---

## 📲 Cara Mengakses & Menginstal PWA di Ponsel (HP)

Aplikasi telah dikonfigurasi dengan `server: { host: true }` sehingga dapat langsung diakses dari perangkat mobile yang berada dalam satu jaringan Wi-Fi:

### Di iPhone (iOS Safari):
1. Buka browser **Safari**, ketik alamat network laptop Anda (misal `http://192.168.11.212:5173/`).
2. Ketuk ikon titik tiga `...` di pojok kanan bawah atau tombol **Share** (`⎋`).
3. Pilih **"Tambah ke Layar Utama"** (*Add to Home Screen*).
4. Ketuk **"Tambah"** (*Add*). Aplikasi akan terpasang di layar utama iPhone dengan logo monogram **ZC** dan berjalan dalam mode *fullscreen standalone*.

### Di Android (Google Chrome):
1. Buka **Google Chrome**, ketik alamat network laptop Anda.
2. Ketuk tombol titik tiga `⋮` di pojok kanan atas.
3. Pilih **"Instal aplikasi"** atau **"Tambahkan ke Layar Utama"**.
4. Aplikasi akan terinstal langsung ke daftar aplikasi HP Anda.

---

## 🗄️ Menjalankan Skrip Database Supabase

Jika ingin membuat skema tabel di akun Supabase Anda:
1. Buka [Supabase Dashboard](https://supabase.com/dashboard) dan pilih project Anda.
2. Masuk ke menu **SQL Editor** (`>_`).
3. Klik **+ New query**.
4. Salin seluruh isi berkas [`supabase/schema.sql`](supabase/schema.sql) dan tempel ke editor.
5. Klik tombol **Run**. Tabel `profiles` dan `shoes` beserta RLS, trigger akun baru, dan 8 seed data sneakers siap digunakan.

---

## 🌐 Panduan Deploy ke Vercel

Proyek ini telah dilengkapi berkas konfigurasi [`vercel.json`](vercel.json):
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### Langkah Deploy:
1. Pastikan seluruh perubahan kode telah di-push ke GitHub:
   ```bash
   git push origin main
   ```
2. Buka [Vercel](https://vercel.com/) dan login menggunakan akun GitHub.
3. Klik **Add New...** &rarr; **Project**.
4. Import repositori `TugasAkhir_Praktikum-PPB`.
5. Vercel akan otomatis mengenali framework **Vite**, build command `npm run build`, dan output directory `dist`.
6. Klik tombol **Deploy**. Tautan live aplikasi Anda akan aktif dalam hitungan detik.

---

## 📄 Lisensi & Hak Cipta

Proyek ini dikembangkan untuk tujuan edukasi dan evaluasi akademik Tugas Akhir Praktikum Pemrograman Perangkat Bergerak (PPB) 2026.  
Hak cipta dilindungi oleh **Shiddiq Yazid Nurhakim** &mdash; Teknik Komputer Universitas Diponegoro.
