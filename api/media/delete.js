import { handleOptions, json, methodAllowed, readJson, requireAdmin } from "../_lib/common.js";
import { getSupabase, mediaBucket } from "../_lib/supabase.js";

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;
  if (!methodAllowed(req, res, ["POST", "DELETE"])) return;
  if (!requireAdmin(req, res)) return;

  try {
    const body = await readJson(req);
    const path = String(body.path || body.mediaPath || "");

    if (!path) {
      return json(res, 400, {
        ok: false,
        error: "Path media kosong."
      });
    }

    const { client, error } = getSupabase();
    if (error) throw new Error(error);

    const result = await client.storage.from(mediaBucket).remove([path]);

    if (result.error) throw result.error;

    return json(res, 200, {
      ok: true,
      path
    });
  } catch (error) {
    return json(res, 500, {
      ok: false,
      error: error.message || "Gagal menghapus media."
    });
  }
}