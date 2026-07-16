import fs from "node:fs";

const appPath = "./src/App.jsx";
let app = fs.readFileSync(appPath, "utf8");

// Tambahkan API_BASE_URL helper setelah AUTH_KEY / STORE_KEY
if (!app.includes("function apiUrl(")) {
  const marker = "function getAuthToken()";
  const helper = `
const API_BASE_URL = String(import.meta.env.VITE_API_BASE_URL || "").replace(/\\/$/, "");

function apiUrl(path) {
  if (!path) return path;
  if (String(path).startsWith("http")) return path;
  return API_BASE_URL ? API_BASE_URL + path : path;
}

`;

  if (app.includes(marker)) {
    app = app.replace(marker, helper + marker);
  } else {
    const firstFunction = app.indexOf("function ");
    app = app.slice(0, firstFunction) + helper + app.slice(firstFunction);
  }
}

// Ubah semua fetch("/api/...") menjadi fetch(apiUrl("/api/..."))
app = app.replaceAll('fetch("/api/', 'fetch(apiUrl("/api/');
app = app.replaceAll("fetch('/api/", "fetch(apiUrl('/api/");

// Tutup kurung fetch(apiUrl("...") untuk pola sederhana
app = app.replaceAll('apiUrl("/api/auth/login",', 'apiUrl("/api/auth/login"),');
app = app.replaceAll('apiUrl("/api/auth/status",', 'apiUrl("/api/auth/status"),');
app = app.replaceAll('apiUrl("/api/db/status",', 'apiUrl("/api/db/status"),');
app = app.replaceAll('apiUrl("/api/db/state",', 'apiUrl("/api/db/state"),');
app = app.replaceAll('apiUrl("/api/ai/chat",', 'apiUrl("/api/ai/chat"),');
app = app.replaceAll('apiUrl("/api/media/upload",', 'apiUrl("/api/media/upload"),');
app = app.replaceAll('apiUrl("/api/media/delete",', 'apiUrl("/api/media/delete"),');

// Kalau ada fetch(apiUrl("/api/...")) yang sudah benar, jangan dobel
app = app.replaceAll('fetch(apiUrl(apiUrl(', 'fetch(apiUrl(');

fs.writeFileSync(appPath, app, "utf8");

console.log("Patch V13B tahap 1 selesai: frontend siap pakai VITE_API_BASE_URL.");
