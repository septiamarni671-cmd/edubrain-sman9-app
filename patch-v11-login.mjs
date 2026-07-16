import fs from "node:fs";

const appPath = "./src/App.jsx";
const serverPath = "./server/index.js";

let app = fs.readFileSync(appPath, "utf8");
let server = fs.readFileSync(serverPath, "utf8");

// ================= SERVER AUTH PATCH =================

if (!server.includes("const adminPassword")) {
  server = server.replace(
    'const provider = (process.env.AI_PROVIDER || "mock").toLowerCase();',
    `const provider = (process.env.AI_PROVIDER || "mock").toLowerCase();

const adminPassword = process.env.EDUBRAIN_ADMIN_PASSWORD || "admin12345";
const adminToken = process.env.EDUBRAIN_ADMIN_TOKEN || "edubrain-local-token";

function getToken(req) {
  const header = req.headers.authorization || "";
  if (header.startsWith("Bearer ")) return header.slice(7);
  return req.headers["x-edubrain-token"] || "";
}

function requireAdmin(req, res, next) {
  const token = getToken(req);

  if (token && token === adminToken) {
    return next();
  }

  return res.status(401).json({
    ok: false,
    error: "Akses admin diperlukan.",
  });
}`
  );
}

if (!server.includes('/api/auth/login')) {
  server = server.replace(
    'app.get("/api/health"',
    `app.post("/api/auth/login", (req, res) => {
  const password = String(req.body?.password || "");

  if (!password) {
    return res.status(400).json({
      ok: false,
      error: "Password belum diisi.",
    });
  }

  if (password !== adminPassword) {
    return res.status(401).json({
      ok: false,
      error: "Password admin salah.",
    });
  }

  return res.json({
    ok: true,
    role: "admin",
    token: adminToken,
  });
});

app.get("/api/auth/status", (req, res) => {
  const token = getToken(req);

  res.json({
    ok: true,
    authenticated: Boolean(token && token === adminToken),
    role: token && token === adminToken ? "admin" : "viewer",
  });
});

app.get("/api/health"`
  );
}

// Proteksi endpoint penting
server = server.replace(
  'app.put("/api/db/state", async (req, res) => {',
  'app.put("/api/db/state", requireAdmin, async (req, res) => {'
);

server = server.replace(
  'app.post("/api/media/upload", upload.single("file"), async (req, res) => {',
  'app.post("/api/media/upload", requireAdmin, upload.single("file"), async (req, res) => {'
);

server = server.replace(
  'app.post("/api/media/delete", async (req, res) => {',
  'app.post("/api/media/delete", requireAdmin, async (req, res) => {'
);

// Hindari dobel requireAdmin kalau patch dijalankan ulang
server = server.replace(/app\.put\("\/api\/db\/state", requireAdmin, requireAdmin,/g, 'app.put("/api/db/state", requireAdmin,');
server = server.replace(/app\.post\("\/api\/media\/upload", requireAdmin, requireAdmin,/g, 'app.post("/api/media/upload", requireAdmin,');
server = server.replace(/app\.post\("\/api\/media\/delete", requireAdmin, requireAdmin,/g, 'app.post("/api/media/delete", requireAdmin,');

// ================= FRONTEND AUTH PATCH =================

if (!app.includes("const AUTH_KEY")) {
  app = app.replace(
    'const STORE_KEY = "edubrain_sman9_notulen_v4";',
    `const STORE_KEY = "edubrain_sman9_notulen_v4";
const AUTH_KEY = "edubrain_sman9_admin_auth";`
  );

  app = app.replace(
    'const STORE_KEY = "edubrain_sman9_mobile_clean_v2";',
    `const STORE_KEY = "edubrain_sman9_mobile_clean_v2";
const AUTH_KEY = "edubrain_sman9_admin_auth";`
  );
}

if (!app.includes("function getAuthToken")) {
  app = app.replace(
    'function uid() {',
    `function getAuthToken() {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed?.token || "";
  } catch {
    return "";
  }
}

function authHeaders(extra = {}) {
  const token = getAuthToken();
  return token
    ? { ...extra, Authorization: \`Bearer \${token}\`, "x-edubrain-token": token }
    : extra;
}

function uid() {`
  );
}

// Tambahkan token ke saveToDb
app = app.replace(
  'headers: { "Content-Type": "application/json" },',
  'headers: authHeaders({ "Content-Type": "application/json" }),'
);

// Tambahkan token ke upload media jika ada
app = app.replace(
  `const r = await fetch("/api/media/upload", {
        method: "POST",
        body: form,
      });`,
  `const r = await fetch("/api/media/upload", {
        method: "POST",
        headers: authHeaders(),
        body: form,
      });`
);

// Tambahkan token ke hapus media jika ada
app = app.replace(
  `fetch("/api/media/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: item.mediaPath }),
      }).catch(() => {});`,
  `fetch("/api/media/delete", {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ path: item.mediaPath }),
      }).catch(() => {});`
);

// Login component
const loginComponent = `
function LoginView({ onLogin }) {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function login() {
    if (!password.trim()) {
      setError("Password belum diisi.");
      return;
    }

    setBusy(true);
    setError("");

    try {
      const r = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const result = await r.json();

      if (!result.ok) {
        throw new Error(result.error || "Login gagal.");
      }

      const auth = {
        role: result.role || "admin",
        token: result.token,
        loginAt: new Date().toISOString(),
      };

      localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
      onLogin(auth);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="loginShell">
      <div className="loginCard">
        <div className="loginLogo">
          <Brain size={34} />
        </div>

        <div className="kicker">
          <ShieldCheck size={15} />
          EduBrain SMAN 9
        </div>

        <h1>Login Admin</h1>
        <p>
          Masuk untuk mengelola notulen, galeri aktivitas, dokumen, dan sinkronisasi database.
        </p>

        <div className="formRow">
          <label className="label">Password admin</label>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && login()}
            placeholder="Masukkan password admin"
            autoFocus
          />
        </div>

        {error && <div className="loginError">{error}</div>}

        <button className="btn primary full" onClick={login} disabled={busy}>
          <ShieldCheck size={18} />
          {busy ? "Memeriksa..." : "Masuk Admin"}
        </button>

        <div className="loginNote">
          Password disimpan di file <b>.env.local</b> pada server lokal.
        </div>
      </div>
    </div>
  );
}

`;

if (!app.includes("function LoginView")) {
  const insertBefore = app.indexOf("function HomeView");
  app = app.slice(0, insertBefore) + loginComponent + app.slice(insertBefore);
}

// App auth state
app = app.replace(
  'const [view, setView] = useState("home");',
  `const [view, setView] = useState("home");
  const [auth, setAuth] = useState(() => {
    try {
      const raw = localStorage.getItem(AUTH_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });`
);

// Logout function before const page
app = app.replace(
  'const page = useMemo(() => {',
  `function logout() {
    localStorage.removeItem(AUTH_KEY);
    setAuth(null);
    setView("home");
  }

  if (!auth?.token) {
    return <LoginView onLogin={setAuth} />;
  }

  const page = useMemo(() => {`
);

// Add logout UI to main
app = app.replace(
  '<main className="main">{page}</main>',
  `<main className="main">
        <div className="adminTopMini">
          <span>Mode Admin Aktif</span>
          <button onClick={logout}>Keluar</button>
        </div>
        {page}
      </main>`
);

// Avoid duplicate replacements
app = app.replace(/headers: authHeaders\(authHeaders\(\{ "Content-Type": "application\/json" \}\)\)/g, 'headers: authHeaders({ "Content-Type": "application/json" })');
app = app.replace(/headers: authHeaders\(authHeaders\(\)\)/g, 'headers: authHeaders()');

fs.writeFileSync(appPath, app, "utf8");
fs.writeFileSync(serverPath, server, "utf8");

console.log("Patch V11 Login Admin selesai.");
