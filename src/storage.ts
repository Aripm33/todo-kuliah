// Generics sederhana: fungsi yang bekerja untuk tipe data apa pun (T).
export function muatData<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function simpanData<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    console.warn("Gagal menyimpan data ke localStorage.");
  }
}

// Generic dengan batasan: T harus punya properti id bertipe number.
export function cariById<T extends { id: number }>(list: T[], id: number): T | undefined {
  return list.find((item) => item.id === id);
}
