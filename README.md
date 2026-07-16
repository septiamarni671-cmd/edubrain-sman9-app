# EduBrain SMAN 9 App

Proyek ini melengkapi `edubrain-prototype.jsx` menjadi aplikasi React yang bisa dijalankan dengan Vite + Tailwind + lucide-react.

## Fitur aktif di versi ini

- Dashboard ringkasan rapat, tugas aktif, dan dokumen.
- Rapat Cerdas: tambah rapat simulasi dari tombol rekam dan upload audio.
- Tugas rapat dapat ditandai selesai/belum selesai.
- Otak Kedua: upload metadata dokumen asli dari komputer, pencarian dokumen, hapus dokumen lokal, dan chat simulasi berbasis kata kunci.
- Data otomatis tersimpan di localStorage browser.
- Ekspor semua data ke JSON dan reset data demo dari halaman Pengaturan.
- Responsif untuk laptop dan HP.

## Cara menjalankan di Windows PowerShell

```powershell
cd "E:\edubrain-sman9-app"
npm.cmd install
npm.cmd run dev
```

Buka alamat yang muncul, biasanya `http://localhost:5173`.

## Catatan penting

Versi ini belum memakai AI sungguhan dan belum membaca isi PDF/DOCX/XLSX. Upload dokumen menyimpan metadata lokal agar UI dan alur kerja hidup dulu. Tahap berikutnya dapat disambungkan ke backend, database, dan API AI.
