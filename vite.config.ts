import { defineConfig } from "vite";

// Jika aplikasi diletakkan di subfolder website pribadi (mis. /todo/),
// ubah base menjadi "/todo/". Untuk root domain biarkan "/".
export default defineConfig({
  base: "/",
});
