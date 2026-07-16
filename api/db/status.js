import { handleOptions, json, methodAllowed } from "../_lib/common.js";
import { dbId, getSupabase, getSupabaseConfig } from "../_lib/supabase.js";

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;
  if (!methodAllowed(req, res, ["GET"])) return;

  const config = getSupabaseConfig();
  const { client, error } = getSupabase();

  let dbReady = false;
  let message = "";

  if (error) {
    message = error;
  } else {
    const result = await client
      .from("edubrain_state")
      .select("id")
      .eq("id", dbId)
      .maybeSingle();

    dbReady = !result.error;
    message = result.error?.message || "Database tersambung.";
  }

  return json(res, 200, {
    ok: true,
    dbReady,
    dbId,
    hasUrl: Boolean(config.url),
    hasKey: Boolean(config.key),
    message
  });
}