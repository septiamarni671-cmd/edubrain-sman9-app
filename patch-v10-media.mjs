import fs from "node:fs";

const appPath = "./src/App.jsx";
const serverPath = "./server/index.js";

let app = fs.readFileSync(appPath, "utf8");
let server = fs.readFileSync(serverPath, "utf8");

// ================= SERVER PATCH =================

if (!server.includes('import multer from "multer";')) {
  server = server.replace(
    'import { createClient } from "@supabase/supabase-js";',
    'import { createClient } from "@supabase/supabase-js";\nimport multer from "multer";'
  );
}

if (!server.includes("const upload = multer")) {
  server = server.replace(
    'app.use(express.json({ limit: "35mb" }));',
    'app.use(express.json({ limit: "35mb" }));\n\nconst upload = multer({\n  storage: multer.memoryStorage(),\n  limits: { fileSize: 100 * 1024 * 1024 },\n});'
  );

  server = server.replace(
    'app.use(express.json({ limit: "10mb" }));',
    'app.use(express.json({ limit: "35mb" }));\n\nconst upload = multer({\n  storage: multer.memoryStorage(),\n  limits: { fileSize: 100 * 1024 * 1024 },\n});'
  );
}

if (!server.includes("const mediaBucket")) {
  server = server.replace(
    'const dbId = process.env.EDUBRAIN_DB_ID || "sman9-main";',
    'const dbId = process.env.EDUBRAIN_DB_ID || "sman9-main";\nconst mediaBucket = process.env.SUPABASE_MEDIA_BUCKET || "edubrain-media";'
  );
}

const mediaFunctions = `
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
`;

if (!server.includes("function safeFileName")) {
  server = server.replace("async function ensureStateRow()", mediaFunctions + "\nasync function ensureStateRow()");
}

const mediaRoutes = `
app.post("/api/media/upload", upload.single("file"), async (req, res) => {
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
    const path = \`\${mediaType}/\${Date.now()}-\${Math.random().toString(36).slice(2)}-\${cleanName}\`;

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

app.post("/api/media/delete", async (req, res) => {
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
`;

if (!server.includes('/api/media/upload')) {
  server = server.replace('app.post("/api/ai/chat"', mediaRoutes + '\napp.post("/api/ai/chat"');
}

// ================= FRONTEND PATCH =================

const mediaPreview = `
function MediaPreview({ item, compact = false }) {
  const src = item?.mediaUrl || item?.image || "";
  const mediaType = item?.mediaType || "image";

  if (!src) {
    return <div className="mediaEmpty">Tidak ada media</div>;
  }

  if (mediaType === "video") {
    return (
      <video
        className={compact ? "mediaPreview compact" : "mediaPreview"}
        src={src}
        controls
        playsInline
        preload="metadata"
      />
    );
  }

  if (mediaType === "audio") {
    return (
      <div className={compact ? "audioPreview compact" : "audioPreview"}>
        <div className="audioIcon">♪</div>
        <audio src={src} controls preload="metadata" />
      </div>
    );
  }

  return (
    <img
      className={compact ? "mediaPreview compact" : "mediaPreview"}
      src={src}
      alt={item?.title || "Media aktivitas"}
    />
  );
}

`;

if (!app.includes("function MediaPreview")) {
  app = app.replace("function HomeView(", mediaPreview + "\nfunction HomeView(");
}

// Home gallery card: image/video/audio
app = app.replace(
`<article className="activityCard" key={item.title}>
                <img src={item.image} alt={item.title} />
                <div className="activityOverlay">
                  <span>{item.meta}</span>
                </div>
              </article>`,
`<article className={"activityCard " + (item.mediaType || "image")} key={item.id || item.title}>
                <MediaPreview item={item} />
                <div className="activityOverlay">
                  <span>{item.meta}</span>
                </div>
              </article>`
);

// Replace ActivitiesView fully
const start = app.indexOf("function ActivitiesView");
const end = app.indexOf("function MeetingsView", start);

if (start >= 0 && end > start) {
  const newActivities = `
function ActivitiesView({ data, setData, apiStatus }) {
  const [title, setTitle] = useState("");
  const [className, setClassName] = useState("XI-A");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [media, setMedia] = useState(null);
  const [busy, setBusy] = useState(false);

  async function handleMedia(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed =
      file.type.startsWith("image/") ||
      file.type.startsWith("video/") ||
      file.type.startsWith("audio/");

    if (!allowed) {
      alert("File harus berupa foto, video, atau audio.");
      e.target.value = "";
      return;
    }

    setBusy(true);

    try {
      const form = new FormData();
      form.append("file", file);

      const r = await fetch("/api/media/upload", {
        method: "POST",
        body: form,
      });

      const result = await r.json();

      if (!result.ok) {
        throw new Error(result.detail || result.error || "Upload gagal.");
      }

      setMedia({
        mediaUrl: result.url,
        mediaPath: result.path,
        mediaType: result.mediaType,
        mimeType: result.mimeType,
        size: result.size,
        originalName: result.name,
      });
    } catch (error) {
      alert("Gagal upload media: " + error.message);
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  }

  function saveActivity() {
    if (!title.trim()) {
      alert("Judul kegiatan belum diisi.");
      return;
    }

    if (!media?.mediaUrl) {
      alert("Media kegiatan belum dipilih.");
      return;
    }

    const item = {
      id: uid(),
      title: title.trim(),
      meta: \`\${className || "Kelas"} · \${new Date(date).toLocaleDateString("id-ID")}\`,
      mediaUrl: media.mediaUrl,
      mediaPath: media.mediaPath,
      mediaType: media.mediaType,
      mimeType: media.mimeType,
      size: media.size,
      originalName: media.originalName,
      createdAt: new Date().toISOString(),
    };

    setData((prev) => ({
      ...prev,
      activities: [item, ...(prev.activities || [])],
    }));

    setTitle("");
    setClassName("XI-A");
    setDate(new Date().toISOString().slice(0, 10));
    setMedia(null);
  }

  async function deleteActivity(item) {
    if (!confirm("Hapus aktivitas ini dari galeri?")) return;

    setData((prev) => ({
      ...prev,
      activities: (prev.activities || []).filter((x) => x.id !== item.id),
    }));

    if (item.mediaPath) {
      fetch("/api/media/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: item.mediaPath }),
      }).catch(() => {});
    }
  }

  const mediaLabel =
    media?.mediaType === "video" ? "Video kegiatan siap disimpan" :
    media?.mediaType === "audio" ? "Rekaman audio siap disimpan" :
    media?.mediaType === "image" ? "Foto kegiatan siap disimpan" :
    "Belum ada media";

  return (
    <>
      <TopBar
        title="Galeri Aktivitas"
        subtitle="Tambahkan dokumentasi foto, video, atau rekaman kegiatan sekolah."
        apiStatus={apiStatus}
      />

      <div className="grid2">
        <div className="card">
          <div className="sectionHead">
            <div>
              <h3>Tambah Aktivitas Multimedia</h3>
              <p>Foto, video presentasi siswa, rekaman kegiatan, atau mengajar guru.</p>
            </div>
          </div>

          <div className="formRow">
            <label className="label">Judul kegiatan</label>
            <input
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Presentasi Kelompok PAI"
            />
          </div>

          <div className="grid2 compactGrid">
            <div className="formRow">
              <label className="label">Kelas</label>
              <input
                className="input"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                placeholder="XI-A"
              />
            </div>

            <div className="formRow">
              <label className="label">Tanggal</label>
              <input
                className="input"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>

          <label className="btn ghost full">
            <Upload size={18} />
            {busy ? "Mengupload media..." : "Pilih Foto / Video / Audio"}
            <input type="file" accept="image/*,video/*,audio/*" hidden onChange={handleMedia} />
          </label>

          <div className="mediaHint">
            Untuk tahap awal, usahakan video maksimal ±100 MB agar upload stabil di jaringan sekolah.
          </div>

          {media && (
            <div className="activityPreview">
              <MediaPreview item={media} />
              <div className="itemSub" style={{ padding: "10px 12px" }}>
                {mediaLabel} · {media.originalName}
              </div>
            </div>
          )}

          <div style={{ height: 12 }} />

          <button className="btn primary full" onClick={saveActivity} disabled={busy}>
            <Plus size={18} />
            Simpan ke Galeri
          </button>
        </div>

        <div className="card">
          <div className="sectionHead">
            <div>
              <h3>Daftar Aktivitas</h3>
              <p>{(data.activities || []).length} aktivitas tersimpan.</p>
            </div>
          </div>

          {!data.activities || data.activities.length === 0 ? (
            <EmptyState
              icon={Upload}
              title="Belum ada aktivitas"
              text="Tambahkan foto, video, atau audio kegiatan pertama."
            />
          ) : (
            <div className="activityManageList">
              {data.activities.map((item) => (
                <div className="activityManageItem media" key={item.id}>
                  <div className="manageMediaBox">
                    <MediaPreview item={item} compact />
                  </div>
                  <div>
                    <b>{item.title}</b>
                    <span>{item.meta}</span>
                    <span>{item.mediaType || "image"} · {item.originalName || "media"}</span>
                  </div>
                  <button className="btn ghost dangerBtn" onClick={() => deleteActivity(item)}>
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

`;
  app = app.slice(0, start) + newActivities + app.slice(end);
}

fs.writeFileSync(appPath, app, "utf8");
fs.writeFileSync(serverPath, server, "utf8");

console.log("Patch V10 media foto/video/audio selesai.");
