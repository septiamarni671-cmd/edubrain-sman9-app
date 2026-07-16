import express from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import multer from "multer";

dotenv.config({ path: ".env.local" });
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = Number(process.env.PORT || 8787);

app.use(cors());
app.use(express.json({ limit: "35mb" }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 },
});

const provider = (process.env.AI_PROVIDER || "mock").toLowerCase();

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
}

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  "";

const dbId = process.env.EDUBRAIN_DB_ID || "sman9-main";
const mediaBucket = process.env.SUPABASE_MEDIA_BUCKET || "edubrain-media";

const supabase =
  supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey)
    : null;

const emptyState = {
  meetings: [],
  documents: [],
  chats: [],
  activities: [],
};

function getProviderInfo() {
  const groqReady = Boolean(process.env.GROQ_API_KEY);
  const geminiReady = Boolean(process.env.GEMINI_API_KEY);
  const openaiReady = Boolean(process.env.OPENAI_API_KEY);

  const ready =
    provider === "groq" ? groqReady :
    provider === "gemini" ? geminiReady :
    provider === "openai" ? openaiReady :
    false;

  const fallbackModel =
    provider === "groq" ? "llama-3.1-8b-instant" :
    provider === "gemini" ? "gemini-1.5-flash" :
    provider === "openai" ? "gpt-4o-mini" :
    "mock-local";

  return {
    provider,
    model: process.env.AI_MODEL || fallbackModel,
    ready,
    configured: {
      groq: groqReady,
      gemini: geminiReady,
      openai: openaiReady,
    },
  };
}


function safeFileName(name = "file") {
  return String(name)
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 120);
}

function detectMediaType(mime = "") {
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  return "file";
}

async function ensureMediaBucket() {
  if (!supabase) throw new Error("Supabase belum dikonfigurasi.");

  const { data, error } = await supabase.storage.getBucket(mediaBucket);

  if (data && !error) return;

  const { error: createError } = await supabase.storage.createBucket(mediaBucket, {
    public: true,
  });

  if (createError && !String(createError.message || "").toLowerCase().includes("already")) {
    throw createError;
  }
}

async function ensureStateRow() {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("edubrain_state")
    .select("id,data,updated_at")
    .eq("id", dbId)
    .maybeSingle();

  if (error) throw error;

  if (data) return data;

  const { data: inserted, error: insertError } = await supabase
    .from("edubrain_state")
    .insert({
      id: dbId,
      data: emptyState,
      updated_at: new Date().toISOString(),
    })
    .select("id,data,updated_at")
    .single();

  if (insertError) throw insertError;

  return inserted;
}

function mockReply(message) {
  const q = String(message || "").toLowerCase();

  if (q.includes("rapat") || q.includes("notulen")) {
    return "EduBrain siap membuat notulen rapat. Jika Groq aktif, hasil akan dibuat oleh AI sungguhan.";
  }

  if (q.includes("surat") || q.includes("bk") || q.includes("pembinaan")) {
    return "EduBrain siap membantu membuat draf surat, catatan pembinaan, dan format tindak lanjut siswa.";
  }

  return "EduBrain aktif. Silakan gunakan menu Rapat atau AI.";
}

app.post("/api/auth/login", (req, res) => {
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

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    name: "EduBrain SMAN 9 API",
    time: new Date().toISOString(),
  });
});

app.get("/api/ai/status", (req, res) => {
  res.json(getProviderInfo());
});

app.get("/api/db/status", (req, res) => {
  res.json({
    ok: true,
    dbReady: Boolean(supabase),
    dbId,
    hasUrl: Boolean(supabaseUrl),
    hasKey: Boolean(supabaseKey),
  });
});

app.get("/api/db/state", async (req, res) => {
  try {
    if (!supabase) {
      return res.json({
        ok: false,
        source: "local-only",
        message: "Supabase belum dikonfigurasi di .env.local",
        data: null,
      });
    }

    const row = await ensureStateRow();

    res.json({
      ok: true,
      source: "supabase",
      dbId,
      data: row.data || emptyState,
      updated_at: row.updated_at,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: "Gagal membaca database Supabase.",
      detail: error.message,
    });
  }
});

app.put("/api/db/state", requireAdmin, async (req, res) => {
  try {
    if (!supabase) {
      return res.json({
        ok: false,
        source: "local-only",
        message: "Supabase belum dikonfigurasi di .env.local",
      });
    }

    const incoming = req.body?.data || emptyState;

    const cleanData = {
      meetings: Array.isArray(incoming.meetings) ? incoming.meetings : [],
      documents: Array.isArray(incoming.documents) ? incoming.documents : [],
      chats: Array.isArray(incoming.chats) ? incoming.chats : [],
      activities: Array.isArray(incoming.activities) ? incoming.activities : [],
    };

    const { data, error } = await supabase
      .from("edubrain_state")
      .upsert({
        id: dbId,
        data: cleanData,
        updated_at: new Date().toISOString(),
      })
      .select("id,data,updated_at")
      .single();

    if (error) throw error;

    res.json({
      ok: true,
      source: "supabase",
      data,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: "Gagal menyimpan ke database Supabase.",
      detail: error.message,
    });
  }
});


app.post("/api/media/upload", requireAdmin, upload.single("file"), async (req, res) => {
  try {
    if (!supabase) {
      return res.status(400).json({
        ok: false,
        error: "Supabase belum dikonfigurasi.",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        ok: false,
        error: "File belum dikirim.",
      });
    }

    await ensureMediaBucket();

    const mediaType = detectMediaType(req.file.mimetype);
    const cleanName = safeFileName(req.file.originalname);
    const path = `${mediaType}/${Date.now()}-${Math.random().toString(36).slice(2)}-${cleanName}`;

    const { data, error } = await supabase.storage
      .from(mediaBucket)
      .upload(path, req.file.buffer, {
        contentType: req.file.mimetype,
        cacheControl: "3600",
        upsert: false,
      });

    if (error) throw error;

    const { data: publicData } = supabase.storage
      .from(mediaBucket)
      .getPublicUrl(data.path);

    res.json({
      ok: true,
      bucket: mediaBucket,
      path: data.path,
      url: publicData.publicUrl,
      mediaType,
      mimeType: req.file.mimetype,
      size: req.file.size,
      name: req.file.originalname,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: "Gagal upload media.",
      detail: error.message,
    });
  }
});

app.post("/api/media/delete", requireAdmin, async (req, res) => {
  try {
    if (!supabase) {
      return res.status(400).json({
        ok: false,
        error: "Supabase belum dikonfigurasi.",
      });
    }

    const path = req.body?.path;

    if (!path) {
      return res.json({
        ok: true,
        skipped: true,
        message: "Tidak ada path media untuk dihapus.",
      });
    }

    const { error } = await supabase.storage
      .from(mediaBucket)
      .remove([path]);

    if (error) throw error;

    res.json({
      ok: true,
      deleted: path,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: "Gagal hapus media.",
      detail: error.message,
    });
  }
});

app.post("/api/ai/chat", async (req, res) => {
  const { message, context } = req.body || {};
  const info = getProviderInfo();

  if (!info.ready) {
    return res.json({
      ok: true,
      provider: "mock",
      text: mockReply(message),
    });
  }

  const systemText =
    "Anda adalah EduBrain SMAN 9, asisten AI untuk guru dan tenaga kependidikan. Jawab dalam bahasa Indonesia yang sopan, praktis, resmi bila diminta, dan membantu pekerjaan sekolah. Jangan mengarang data.";

  try {
    if (info.provider === "groq" || info.provider === "openai") {
      const isGroq = info.provider === "groq";
      const url = isGroq
        ? "https://api.groq.com/openai/v1/chat/completions"
        : "https://api.openai.com/v1/chat/completions";

      const key = isGroq ? process.env.GROQ_API_KEY : process.env.OPENAI_API_KEY;

      const r = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model: info.model,
          messages: [
            { role: "system", content: systemText },
            { role: "user", content: `${context || ""}\n\n${message}` },
          ],
          temperature: 0.35,
        }),
      });

      const data = await r.json();
      const text =
        data?.choices?.[0]?.message?.content ||
        data?.error?.message ||
        "AI tidak mengembalikan jawaban.";

      return res.json({
        ok: true,
        provider: info.provider,
        text,
      });
    }

    return res.json({
      ok: true,
      provider: "mock",
      text: mockReply(message),
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: "Gagal menghubungi AI provider.",
      detail: error.message,
    });
  }
});



// EDUBRAIN_PRODUCTION_STATIC_V13
const distPath = path.join(__dirname, "../dist");

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));

  app.use((req, res, next) => {
    if (req.method === "GET" && !req.path.startsWith("/api")) {
      return res.sendFile(path.join(distPath, "index.html"));
    }

    return next();
  });
}

app.listen(port, "0.0.0.0", () => {
  console.log(`EduBrain API aktif di http://localhost:${port}`);
});

