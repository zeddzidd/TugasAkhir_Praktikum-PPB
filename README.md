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

## ✨ Pemenuhan 5 Kriteria Penilaian Tugas Akhir Praktikum PPB

Aplikasi ini telah memenuhi dan melampaui **100% dari 5 Kriteria Utama** yang dipersyaratkan pada Tugas Akhir Praktikum Pemrograman Perangkat Bergerak:

| No | Kriteria Tugas Akhir Praktikum PPB | Status | Bukti & Keterangan Implementasi pada ZedConsign |
| :---: | :--- | :---: | :--- |
| **1** | **Menggunakan API (Web Service) yang dibuat sendiri sesuai dengan Modul 1** | ✅ **TERPENUHI** | Terhubung ke **Supabase Cloud PostgreSQL REST API** (`https://pkyghvhifthnxlrzfpoc.supabase.co/rest/v1/`) yang mengelola tabel `users`, `profiles`, dan `shoes`. Endpoint mendukung operasi CRUD penuh (GET, POST, PATCH/UPSERT, DELETE) langsung via REST client tanpa limitasi email. |
| **2** | **Memiliki Bottom Navigation Bar** | ✅ **TERPENUHI** | Memiliki bar navigasi bawah bergerak (**Bottom Navigation Bar PWA**) dengan 5 item menu responsif yang selalu dapat diakses di bagian bawah layar ponsel: **Home**, **Kelola**, **Sell**, **Pesanan**, dan **Profile**. |
| **3** | **Memiliki minimal 5 halaman** | ✅ **TERPENUHI** | Memiliki **5 halaman mandiri lengkap**: <br>1. `Katalog Sepatu` (Beranda Marketplace & Banner Slider)<br>2. `Kelola Inventaris` (Manajemen CRUD & Stok Sepatu)<br>3. `Titip Jual` (Formulir Konsinyasi & Uploader 8 Foto)<br>4. `Pesanan & Resi` (Daftar Riwayat Order, Ekspedisi, Vault Tracking)<br>5. `Profil & About` (Akun Pengguna, Deskripsi PWA & Data Mahasiswa) |
| **4** | **Minimal terdapat 2 halaman utama yang memiliki list dan setiap item pada list dapat diklik untuk menampilkan halaman detail** | ✅ **TERPENUHI** (Memiliki 3 Halaman List-Detail) | 1. **Halaman Katalog**: List kartu sepatu $\rightarrow$ diklik membuka **Modal Detail Sepatu**, multi-angle gallery 8 foto, selector ukuran dinamis, dan checkout pembayaran.<br>2. **Halaman Kelola Inventaris**: List tabel sepatu $\rightarrow$ diklik / tombol **👁️ Detail** membuka **Modal Detail Inventaris**, spesifikasi lengkap, stok, harga, dan foto sudut.<br>3. **Halaman Pesanan**: List kartu order $\rightarrow$ diklik membuka **Modal Detail Pesanan & Resi**, QRIS keaslian, tracking ekspedisi, dan invoice resmi. |
| **5** | **Memiliki 1 halaman Profile/About aplikasi** | ✅ **TERPENUHI** | Halaman **Profile / About** memuat: <br>&bull; Identitas Lengkap Mahasiswa: **Shiddiq Yazid Nurhakim**, **NIM: 21120124140120**, **Kelompok 41**, S1 Teknik Komputer UNDIP.<br>&bull; Informasi akun pengguna, status keanggotaan consignor terverifikasi, edit profil langsung ke Supabase.<br>&bull; About aplikasi (arsitektur PWA Workbox, Supabase PostgreSQL, offline fallback). |

---

## 📱 5 Halaman Utama & Struktur Navigasi

```
ZedConsign App
├── Header (Logo ZC, Search Bar, Sub-Nav Strip, Auth Masuk/Daftar)
├── Offline Banner (Deteksi Status Jaringan Real-Time)
├── Main Content:
│   ├── [Halaman 1: Katalog (Home)]  -> List Sepatu -> Modal Detail Sepatu & Checkout Pembayaran
│   ├── [Halaman 2: Kelola (CRUD)]   -> List Inventaris -> Modal Detail Spesifikasi & Stok
│   ├── [Halaman 3: Titip Jual (Sell)] -> Formulir 4 Langkah, Kalkulator Fee 5%, Uploader 8 Foto
│   ├── [Halaman 4: Pesanan (Orders)] -> List Pesanan -> Modal Detail Invoice, Resi & Sertifikat Vault
│   └── [Halaman 5: Profil & About]   -> Identitas Shiddiq Yazid, NIM, Kelompok 41, Edit Profil & About PWA
├── Support Floating Widget (WhatsApp Help Desk)
├── Auth Modal (Login & Register Popup dengan direct database storage)
├── Mobile Bottom Navigation Bar (5 Menu: Home, Kelola, Sell, Pesanan, Profile)
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
