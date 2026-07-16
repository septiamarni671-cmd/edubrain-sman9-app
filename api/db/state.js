import { handleOptions, json, methodAllowed, readJson, requireAdmin } from "../_lib/common.js";
import { loadState, saveState } from "../_lib/supabase.js";

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;
  if (!methodAllowed(req, res, ["GET", "PUT", "POST"])) return;

  try {
    if (req.method === "GET") {
      const data = await loadState();
      return json(res, 200, { ok: true, data });
    }

    if (!requireAdmin(req, res)) return;

    const body = await readJson(req);
    const incoming = body && typeof body.data === "object" ? body.data : body;
    const data = await saveState(incoming);

    return json(res, 200, {
      ok: true,
      data
    });
  } catch (error) {
    return json(res, 500, {
      ok: false,
      error: error.message || "Gagal memproses database."
    });
  }
}