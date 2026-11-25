import "./style.css";
import { config } from "./config";
import { cariById, muatData, simpanData } from "./storage";
import type { Filter, Tugas, TugasInput } from "./types";

const STORAGE_KEY = "tugas-kuliah:v1";

// ---------- State ----------
let daftar: Tugas[] = muatData<Tugas[]>(STORAGE_KEY, []);
let filterAktif: Filter = "Semua";
let editId: number | null = null;

// ---------- Helper DOM ----------
function ambil<T extends HTMLElement>(selector: string): T {
  const node = document.querySelector<T>(selector);
  if (!node) throw new Error(`Elemen tidak ditemukan: ${selector}`);
  return node;
}

function buat<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text; // textContent: aman dari XSS
  return node;
}

const form = ambil<HTMLFormElement>("#form-tugas");
const inJudul = ambil<HTMLInputElement>("#judul");
const inMatkul = ambil<HTMLInputElement>("#matkul");
const inTenggat = ambil<HTMLInputElement>("#tenggat");
const btnSimpan = ambil<HTMLButtonElement>("#btn-simpan");
const btnBatal = ambil<HTMLButtonElement>("#btn-batal");
const ul = ambil<HTMLUListElement>("#daftar");
const kosong = ambil<HTMLParagraphElement>("#kosong");
const ringkasan = ambil<HTMLParagraphElement>("#ringkasan");
const tombolFilter = document.querySelectorAll<HTMLButtonElement>("[data-filter]");

// ---------- Logika tanggal ----------
function parseTanggal(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function sisaHari(tenggat: string): number {
  const sekarang = new Date();
  const hariIni = new Date(sekarang.getFullYear(), sekarang.getMonth(), sekarang.getDate());
  return Math.round((parseTanggal(tenggat).getTime() - hariIni.getTime()) / 86_400_000);
}

function keteranganSisa(sisa: number, selesai: boolean): string {
  if (selesai) return "sudah selesai";
  if (sisa < 0) return `terlambat ${-sisa} hari`;
  if (sisa === 0) return "tenggat hari ini";
  if (sisa === 1) return "tenggat besok";
  return `${sisa} hari lagi`;
}

// ---------- Operasi CRUD ----------
function perbarui(): void {
  simpanData<Tugas[]>(STORAGE_KEY, daftar);
  render();
}

function tambah(input: TugasInput): void {
  daftar.push({ id: Date.now(), ...input, status: "Belum Selesai" });
  perbarui();
}

function ubah(id: number, input: TugasInput): void {
  const tugas = cariById(daftar, id);
  if (tugas) Object.assign(tugas, input);
  perbarui();
}

function hapus(id: number): void {
  daftar = daftar.filter((t) => t.id !== id);
  if (editId === id) resetForm();
  perbarui();
}

function ubahStatus(id: number): void {
  const tugas = cariById(daftar, id);
  if (tugas) tugas.status = tugas.status === "Selesai" ? "Belum Selesai" : "Selesai";
  perbarui();
}

// ---------- Form ----------
function mulaiEdit(tugas: Tugas): void {
  editId = tugas.id;
  inJudul.value = tugas.judul;
  inMatkul.value = tugas.matkul;
  inTenggat.value = tugas.tenggat;
  btnSimpan.textContent = "Simpan perubahan";
  btnBatal.hidden = false;
  form.scrollIntoView({ behavior: "smooth", block: "start" });
  inJudul.focus();
}

function resetForm(): void {
  form.reset();
  editId = null;
  btnSimpan.textContent = "Tambah tugas";
  btnBatal.hidden = true;
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const input: TugasInput = {
    judul: inJudul.value.trim(),
    matkul: inMatkul.value.trim(),
    tenggat: inTenggat.value,
  };
  if (!input.judul || !input.matkul || !input.tenggat) return;
  if (editId === null) tambah(input);
  else ubah(editId, input);
  resetForm();
});

btnBatal.addEventListener("click", resetForm);

tombolFilter.forEach((tombol) => {
  tombol.addEventListener("click", () => {
    filterAktif = tombol.dataset.filter as Filter;
    render();
  });
});

// ---------- Render ----------
function urutkan(a: Tugas, b: Tugas): number {
  if (a.status !== b.status) return a.status === "Belum Selesai" ? -1 : 1;
  return a.tenggat.localeCompare(b.tenggat);
}

function buatItem(t: Tugas): HTMLLIElement {
  const selesai: boolean = t.status === "Selesai";
  const sisa = sisaHari(t.tenggat);
  const li = buat("li", selesai ? "tugas selesai" : "tugas");

  const tgl = parseTanggal(t.tenggat);
  const tab = buat("div", "tab-tanggal");
  if (!selesai && sisa < 0) tab.classList.add("telat");
  else if (!selesai && sisa <= 2) tab.classList.add("dekat");
  tab.append(
    buat("span", "tab-bulan", tgl.toLocaleDateString("id-ID", { month: "short" })),
    buat("span", "tab-hari", String(tgl.getDate())),
  );

  const isi = buat("div", "isi");
  isi.append(
    buat("h3", "judul-tugas", t.judul),
    buat("p", "meta", `${t.matkul}, ${keteranganSisa(sisa, selesai)}`),
  );

  const aksi = buat("div", "aksi");
  const btnStatus = buat("button", selesai ? "status selesai" : "status", t.status);
  btnStatus.type = "button";
  btnStatus.title = "Klik untuk mengubah status";
  btnStatus.addEventListener("click", () => ubahStatus(t.id));

  const btnEdit = buat("button", "btn kecil", "Edit");
  btnEdit.type = "button";
  btnEdit.addEventListener("click", () => mulaiEdit(t));

  const btnHapus = buat("button", "btn kecil bahaya", "Hapus");
  btnHapus.type = "button";
  btnHapus.addEventListener("click", () => {
    if (confirm(`Hapus tugas "${t.judul}"?`)) hapus(t.id);
  });

  aksi.append(btnStatus, btnEdit, btnHapus);
  li.append(tab, isi, aksi);
  return li;
}

function render(): void {
  const terlihat = daftar
    .filter((t) => filterAktif === "Semua" || t.status === filterAktif)
    .sort(urutkan);

  ul.replaceChildren(...terlihat.map(buatItem));

  kosong.hidden = terlihat.length > 0;
  kosong.textContent =
    daftar.length === 0
      ? "Belum ada tugas. Isi formulir di atas untuk menambahkan tugas pertama."
      : "Tidak ada tugas dengan status ini.";

  const belum = daftar.filter((t) => t.status === "Belum Selesai").length;
  ringkasan.textContent = `${belum} belum selesai dari ${daftar.length} tugas`;

  tombolFilter.forEach((tombol) =>
    tombol.setAttribute("aria-pressed", String(tombol.dataset.filter === filterAktif)),
  );
}

// ---------- Inisialisasi ----------
document.title = config.nama;
ambil<HTMLElement>("#app-name").textContent = config.nama;
ambil<HTMLElement>("#app-version").textContent = config.versi;
render();
