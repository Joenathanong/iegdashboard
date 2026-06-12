# 📺 TV Slideshow Manager

Aplikasi slideshow untuk Smart TV dengan Firebase Firestore sebagai database.

## 🚀 Setup Firebase (WAJIB sebelum deploy)

### Langkah 1 — Buat Firebase Project
1. Buka [console.firebase.google.com](https://console.firebase.google.com)
2. Klik **Add project** → beri nama → Create
3. Di sidebar kiri → **Firestore Database** → **Create database**
4. Pilih mode **Production** → pilih region (contoh: `asia-southeast1`) → Enable

### Langkah 2 — Atur Firestore Rules
Di Firestore → **Rules**, ganti dengan:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false; // Semua akses hanya via Admin SDK
    }
  }
}
```

### Langkah 3 — Buat Service Account (untuk server)
1. Firebase Console → ⚙️ Project Settings → **Service accounts**
2. Klik **Generate new private key** → Download JSON
3. Ambil nilai: `project_id`, `client_email`, `private_key`

### Langkah 4 — Environment Variables di Vercel
Di Vercel Dashboard → Project → **Settings** → **Environment Variables**, tambahkan:

| Key | Value |
|---|---|
| `FIREBASE_PROJECT_ID` | project_id dari JSON |
| `FIREBASE_CLIENT_EMAIL` | client_email dari JSON |
| `FIREBASE_PRIVATE_KEY` | private_key dari JSON (copy persis dengan \n) |

## 🚀 Deploy ke Vercel

### Via GitHub:
1. Push folder ini ke GitHub
2. Import di [vercel.com](https://vercel.com)
3. Tambahkan environment variables di atas
4. Deploy ✅

### Via CLI:
```bash
npm install -g vercel
vercel
# Ikuti panduan, lalu set env variables di dashboard
```

## 💻 Jalankan Lokal
```bash
# Copy dan isi env variables
cp .env.local.example .env.local
# Edit .env.local dengan nilai dari Firebase

npm install
npm run dev
```

## 🔐 Akses Admin
- URL: `/admin`
- Password default: `admin123` ← **Ganti segera setelah login pertama!**

## 📺 Cara Pakai di Smart TV
1. Buka browser di Smart TV
2. Buka URL: `https://your-app.vercel.app`
3. Aktifkan fullscreen (F11)
4. Slideshow berjalan otomatis! 🎉

## ⚠️ Catatan iframe
Beberapa website memblokir tampilan via iframe (Google Search, YouTube, dll).
Gunakan URL yang mendukung embed, seperti:
- Google Apps Script Web App (`/exec` bukan `/edit`)  
- Looker Studio dengan embed diaktifkan
- Web app buatan sendiri
