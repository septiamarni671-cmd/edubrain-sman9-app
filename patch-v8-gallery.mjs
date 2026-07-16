import fs from "node:fs";

const appPath = "./src/App.jsx";
const serverPath = "./server/index.js";

let app = fs.readFileSync(appPath, "utf8");
let server = fs.readFileSync(serverPath, "utf8");

app = app.replace(
`const initialData = {
  meetings: [],
  documents: [],
  chats: [],
};`,
`const initialData = {
  meetings: [],
  documents: [],
  chats: [],
  activities: [],
};`
);

app = app.replace(
`const navItems = [
  { id: "home", label: "Home", icon: Home },
  { id: "meetings", label: "Rapat", icon: Mic },
  { id: "brain", label: "AI", icon: Brain },
  { id: "settings", label: "Setelan", icon: Settings },
];`,
`const navItems = [
  { id: "home", label: "Home", icon: Home },
  { id: "meetings", label: "Rapat", icon: Mic },
  { id: "activities", label: "Aktivitas", icon: Upload },
  { id: "brain", label: "AI", icon: Brain },
  { id: "settings", label: "Setelan", icon: Settings },
];`
);

app = app.replace(
`return {
    meetings: Array.isArray(input?.meetings) ? input.meetings : [],
    documents: Array.isArray(input?.documents) ? input.documents : [],
    chats: Array.isArray(input?.chats) ? input.chats : [],
  };`,
`return {
    meetings: Array.isArray(input?.meetings) ? input.meetings : [],
    documents: Array.isArray(input?.documents) ? input.documents : [],
    chats: Array.isArray(input?.chats) ? input.chats : [],
    activities: Array.isArray(input?.activities) ? input.activities : [],
  };`
);

app = app.replace(
`return data.meetings.length > 0 || data.documents.length > 0 || data.chats.length > 0;`,
`return data.meetings.length > 0 || data.documents.length > 0 || data.chats.length > 0 || data.activities.length > 0;`
);

if (!app.includes("function resizeImageFile")) {
  app = app.replace(
`function useEduData() {`,
`function resizeImageFile(file) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith("image/")) {
      reject(new Error("File bukan gambar."));
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const img = new Image();

      img.onload = () => {
        const maxW = 1100;
        const maxH = 760;
        let w = img.width;
        let h = img.height;

        const ratio = Math.min(maxW / w, maxH / h, 1);
        w = Math.round(w * ratio);
        h = Math.round(h * ratio);

        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);

        const dataUrl = canvas.toDataURL("image/jpeg", 0.78);
        resolve(dataUrl);
      };

      img.onerror = () => reject(new Error("Gambar tidak bisa dibaca."));
      img.src = reader.result;
    };

    reader.onerror = () => reject(new Error("Gagal membaca gambar."));
    reader.readAsDataURL(file);
  });
}

function useEduData() {`
  );
}

const galleryStart = app.indexOf("  const gallery = [");
const homeReturn = app.indexOf("  return (", galleryStart);

if (galleryStart !== -1 && homeReturn !== -1) {
  const newGallery = `  const fallbackGallery = [
    {
      title: "Presentasi Siswa",
      meta: "XI-A · 15/07/2026",
      image: "/gallery/activity-1.svg",
    },
    {
      title: "Diskusi Perpustakaan",
      meta: "XI-A · 15/07/2026",
      image: "/gallery/activity-2.svg",
    },
    {
      title: "Praktikum Laboratorium",
      meta: "XI-A · 15/07/2026",
      image: "/gallery/activity-3.svg",
    },
    {
      title: "Pentas Seni Sekolah",
      meta: "XI-A · 17/07/2026",
      image: "/gallery/activity-4.svg",
    },
    {
      title: "Rapat Kelas",
      meta: "XI-A · 18/07/2026",
      image: "/gallery/activity-5.svg",
    },
    {
      title: "Kegiatan Literasi",
      meta: "XI-A · 19/07/2026",
      image: "/gallery/activity-6.svg",
    },
  ];

  const gallery = Array.isArray(data.activities) && data.activities.length > 0
    ? data.activities.slice(0, 8)
    : fallbackGallery;

`;

  app = app.slice(0, galleryStart) + newGallery + app.slice(homeReturn);
}

const activityComponent = `
function ActivitiesView({ data, setData, apiStatus }) {
  const [title, setTitle] = useState("");
  const [className, setClassName] = useState("XI-A");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [image, setImage] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleImage(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setBusy(true);

    try {
      const dataUrl = await resizeImageFile(file);
      setImage(dataUrl);
    } catch (error) {
      alert(error.message);
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

    if (!image) {
      alert("Foto kegiatan belum dipilih.");
      return;
    }

    const item = {
      id: uid(),
      title: title.trim(),
      meta: \`\${className || "Kelas"} · \${new Date(date).toLocaleDateString("id-ID")}\`,
      image,
      createdAt: new Date().toISOString(),
    };

    setData((prev) => ({
      ...prev,
      activities: [item, ...(prev.activities || [])],
    }));

    setTitle("");
    setClassName("XI-A");
    setDate(new Date().toISOString().slice(0, 10));
    setImage("");
  }

  function deleteActivity(id) {
    if (!confirm("Hapus aktivitas ini dari galeri?")) return;

    setData((prev) => ({
      ...prev,
      activities: (prev.activities || []).filter((item) => item.id !== id),
    }));
  }

  return (
    <>
      <TopBar
        title="Galeri Aktivitas"
        subtitle="Tambahkan dokumentasi kegiatan siswa agar tampil di dashboard Home."
        apiStatus={apiStatus}
      />

      <div className="grid2">
        <div className="card">
          <div className="sectionHead">
            <div>
              <h3>Tambah Aktivitas Siswa</h3>
              <p>Foto akan dikompres otomatis agar ringan di HP.</p>
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
            {busy ? "Memproses foto..." : "Pilih Foto Aktivitas"}
            <input type="file" accept="image/*" hidden onChange={handleImage} />
          </label>

          {image && (
            <div className="activityPreview">
              <img src={image} alt="Preview aktivitas" />
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
              text="Tambahkan foto kegiatan pertama agar tampil di dashboard."
            />
          ) : (
            <div className="activityManageList">
              {data.activities.map((item) => (
                <div className="activityManageItem" key={item.id}>
                  <img src={item.image} alt={item.title} />
                  <div>
                    <b>{item.title}</b>
                    <span>{item.meta}</span>
                  </div>
                  <button className="btn ghost dangerBtn" onClick={() => deleteActivity(item.id)}>
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

if (!app.includes("function ActivitiesView")) {
  const insertBefore = app.indexOf("function MeetingsView");
  app = app.slice(0, insertBefore) + activityComponent + app.slice(insertBefore);
}

app = app.replace(
`if (view === "meetings") return <MeetingsView data={data} setData={setData} apiStatus={apiStatus} />;`,
`if (view === "meetings") return <MeetingsView data={data} setData={setData} apiStatus={apiStatus} />;
    if (view === "activities") return <ActivitiesView data={data} setData={setData} apiStatus={apiStatus} />;`
);

server = server.replace(
`app.use(express.json({ limit: "10mb" }));`,
`app.use(express.json({ limit: "35mb" }));`
);

server = server.replace(
`const emptyState = {
  meetings: [],
  documents: [],
  chats: [],
};`,
`const emptyState = {
  meetings: [],
  documents: [],
  chats: [],
  activities: [],
};`
);

server = server.replace(
`const cleanData = {
      meetings: Array.isArray(incoming.meetings) ? incoming.meetings : [],
      documents: Array.isArray(incoming.documents) ? incoming.documents : [],
      chats: Array.isArray(incoming.chats) ? incoming.chats : [],
    };`,
`const cleanData = {
      meetings: Array.isArray(incoming.meetings) ? incoming.meetings : [],
      documents: Array.isArray(incoming.documents) ? incoming.documents : [],
      chats: Array.isArray(incoming.chats) ? incoming.chats : [],
      activities: Array.isArray(incoming.activities) ? incoming.activities : [],
    };`
);

fs.writeFileSync(appPath, app, "utf8");
fs.writeFileSync(serverPath, server, "utf8");

console.log("Patch V8 Galeri Aktivitas selesai.");
