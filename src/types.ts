// Type alias + union type
export type Status = "Belum Selesai" | "Selesai";
export type Filter = "Semua" | Status;

// Interface
export interface Tugas {
  id: number; // primitive: number
  judul: string; // primitive: string
  matkul: string;
  tenggat: string; // format YYYY-MM-DD
  status: Status;
}

// Type alias dari tipe lain (utility type)
export type TugasInput = Omit<Tugas, "id" | "status">;

export interface AppConfig {
  nama: string;
  versi: string;
}
