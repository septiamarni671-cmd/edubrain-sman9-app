import { handleOptions, json, methodAllowed, readJson } from "../_lib/common.js";

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;
  if (!methodAllowed(req, res, ["POST"])) return;

  const body = await readJson(req);
  const password = String(body.password || body.adminPassword || "");
  const expectedPassword = process.env.EDUBRAIN_ADMIN_PASSWORD || "";
  const token = process.env.EDUBRAIN_ADMIN_TOKEN || "";

  if (!expectedPassword || !token) {
    return json(res, 500, {
      ok: false,
      error: "ENV admin belum lengkap."
    });
  }

  if (password !== expectedPassword) {
    return json(res, 401, {
      ok: false,
      error: "Password admin salah."
    });
  }

  return json(res, 200, {
    ok: true,
    token,
    admin: true
  });
}