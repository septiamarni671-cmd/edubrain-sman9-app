import { createClient } from "@supabase/supabase-js";

export const dbId = process.env.EDUBRAIN_DB_ID || "sman9-main";
export const mediaBucket = process.env.SUPABASE_MEDIA_BUCKET || "edubrain-media";

export function getSupabaseConfig() {
  return {
    url: process.env.SUPABASE_URL || "",
    key: process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  };
}

export function getSupabase() {
  const config = getSupabaseConfig();

  if (!config.url || !config.key) {
    return {
      client: null,
      error: "Supabase belum dikonfigurasi."
    };
  }

  const client = createClient(config.url, config.key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });

  return { client, error: null };
}

export function emptyState() {
  return {
    meetings: [],
    documents: [],
    chats: [],
    activities: []
  };
}

export function normalizeState(value) {
  const base = value && typeof value === "object" ? value : {};
  return {
    meetings: Array.isArray(base.meetings) ? base.meetings : [],
    documents: Array.isArray(base.documents) ? base.documents : [],
    chats: Array.isArray(base.chats) ? base.chats : [],
    activities: Array.isArray(base.activities) ? base.activities : []
  };
}

export async function loadState() {
  const { client, error } = getSupabase();
  if (error) throw new Error(error);

  const result = await client
    .from("edubrain_state")
    .select("data")
    .eq("id", dbId)
    .maybeSingle();

  if (result.error) throw result.error;

  return normalizeState(result.data?.data || emptyState());
}

export async function saveState(state) {
  const { client, error } = getSupabase();
  if (error) throw new Error(error);

  const safeState = normalizeState(state);

  const result = await client
    .from("edubrain_state")
    .upsert(
      {
        id: dbId,
        data: safeState,
        updated_at: new Date().toISOString()
      },
      { onConflict: "id" }
    )
    .select("data")
    .single();

  if (result.error) throw result.error;

  return normalizeState(result.data?.data || safeState);
}