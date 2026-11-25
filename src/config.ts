import type { AppConfig } from "./types";

// Nilai dibaca dari file .env (hanya konfigurasi non-rahasia).
// Semua variabel berawalan VITE_ ikut masuk ke bundle dan terlihat publik.
export const config: AppConfig = {
  nama: import.meta.env.VITE_APP_NAME ?? "Daftar Tugas Kuliah",
  versi: import.meta.env.VITE_APP_VERSION ?? "1.0.0",
};
