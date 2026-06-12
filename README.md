# 📺 TV Slideshow Manager

Aplikasi manajemen slideshow untuk menampilkan dashboard/link di Smart TV, dengan panel admin untuk mengatur konten.

## ✨ Fitur

- **Slideshow Player** — Tampilkan link/dashboard di TV via iframe, otomatis berganti sesuai durasi
- **Progress bar** — Indikator visual waktu tersisa setiap slide
- **Admin Dashboard** — Tambah, edit, hapus, aktif/nonaktif slide
- **Drag & Drop** — Atur urutan tampil dengan drag
- **Timer per slide** — Atur durasi masing-masing slide (detik)
- **Pause/Resume** — Kontrol slideshow saat hover
- **Auto-refresh** — Perubahan admin otomatis diterapkan dalam 60 detik

## 🚀 Deploy ke Vercel

### Cara 1: Via Vercel CLI
```bash
npm install -g vercel
cd slideshow-tv
npm install
vercel
```

### Cara 2: Via GitHub
1. Push folder ini ke GitHub
2. Login ke [vercel.com](https://vercel.com)
3. Import repository
4. Deploy otomatis ✅

## 💻 Jalankan Lokal

```bash
npm install
npm run dev
# Buka http://localhost:3000
```

## 🔐 Akses Admin

- URL: `/admin`
- Password default: `admin123`
- **Wajib ganti password** setelah pertama login!

## 📺 Cara Pakai di Smart TV

1. Buka browser di Smart TV
2. Navigasi ke URL aplikasi (misal: `https://your-app.vercel.app`)
3. Tekan F11 atau aktifkan fullscreen
4. Slideshow berjalan otomatis!

## ⚠️ Catatan Penting

- **Vercel Serverless**: Data slide disimpan di filesystem. Di Vercel (serverless), data akan reset saat cold start. Untuk produksi, disarankan upgrade ke database (Vercel KV / Supabase).
- **iframe restrictions**: Beberapa website memblokir tampilan via iframe (X-Frame-Options). Google Apps Script umumnya bisa ditampilkan.
- Password disimpan di file JSON — untuk keamanan tinggi, gunakan variabel environment.

## 🗂️ Struktur Proyek

```
slideshow-tv/
├── pages/
│   ├── index.tsx          # Slideshow Player (TV)
│   ├── admin/
│   │   ├── index.tsx      # Login admin
│   │   └── dashboard.tsx  # Dashboard admin
│   └── api/
│       ├── slides.ts      # Public API (get slides)
│       └── admin.ts       # Admin API (CRUD)
├── lib/
│   ├── types.ts           # TypeScript types
│   └── storage.ts         # File storage
├── styles/
│   └── globals.css
└── data/
    └── slides.json        # Data tersimpan di sini
```
