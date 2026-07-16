export function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", process.env.ALLOWED_ORIGIN || "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Admin-Token");
}

export function handleOptions(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return true;
  }
  return false;
}

export function json(res, status, payload) {
  setCors(res);
  return res.status(status).json(payload);
}

export function methodAllowed(req, res, allowed) {
  if (allowed.includes(req.method)) return true;
  json(res, 405, { ok: false, error: "Method tidak diizinkan." });
  return false;
}

export async function readJson(req) {
  if (req.body && typeof req.body === "object") return req.body;

  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body || "{}");
    } catch {
      return {};
    }
  }

  return await new Promise((resolve) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(raw || "{}"));
      } catch {
        resolve({});
      }
    });
    req.on("error", () => resolve({}));
  });
}

export function getToken(req) {
  const auth = req.headers.authorization || "";
  if (auth.startsWith("Bearer ")) return auth.slice(7).trim();
  return req.headers["x-admin-token"] || "";
}

export function isAdmin(req) {
  const expected = process.env.EDUBRAIN_ADMIN_TOKEN;
  const token = getToken(req);
  return Boolean(expected && token && token === expected);
}

export function requireAdmin(req, res) {
  if (isAdmin(req)) return true;
  json(res, 401, { ok: false, error: "Akses admin diperlukan." });
  return false;
}