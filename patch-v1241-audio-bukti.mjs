import fs from "node:fs";

const appPath = "./src/App.jsx";
const cssPath = "./src/index.css";

let app = fs.readFileSync(appPath, "utf8");
let css = fs.readFileSync(cssPath, "utf8");

// Pastikan useRef ada di import React
app = app.replace(
  'import { useEffect, useMemo, useState } from "react";',
  'import { useEffect, useMemo, useRef, useState } from "react";'
);

app = app.replace(
  "import { useEffect, useMemo, useState } from 'react';",
  "import { useEffect, useMemo, useRef, useState } from 'react';"
);

// Jika format import React berbeda, tambahkan useRef secara aman
const reactImport = app.match(/import\s+\{([^}]+)\}\s+from\s+["']react["'];/);
if (reactImport && !reactImport[1].includes("useRef")) {
  const newReactImport = reactImport[0].replace("{", "{ useRef,");
  app = app.replace(reactImport[0], newReactImport);
}

// Pastikan ikon Square ada
const lucideImport = app.match(/import\s+\{([\s\S]*?)\}\s+from\s+["']lucide-react["'];/);
if (lucideImport && !lucideImport[1].includes("Square")) {
  const newLucideImport = lucideImport[0].replace("{", "{ Square,");
  app = app.replace(lucideImport[0], newLucideImport);
}

const component = `
function EvidenceAudioRecorder({ data, setData }) {
  const [saveEvidence, setSaveEvidence] = useState(false);
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [duration, setDuration] = useState(0);
  const [message, setMessage] = useState("Mode hemat aktif: rekaman audio tidak disimpan.");
  const [lastUrl, setLastUrl] = useState("");

  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  function formatTime(sec) {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;

    if (h > 0) {
      return h + ":" + String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
    }

    return m + ":" + String(s).padStart(2, "0");
  }

  async function startEvidenceRecording() {
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      alert("Browser ini belum mendukung perekam audio. Coba pakai Chrome laptop atau Chrome Android.");
      return;
    }

    try {
      setMessage(saveEvidence ? "Merekam bukti audio. Audio akan disimpan setelah dihentikan." : "Merekam sementara. Audio akan dibuang setelah dihentikan.");
      setLastUrl("");
      setDuration(0);
      chunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      let options = {};
      if (MediaRecorder.isTypeSupported("audio/webm")) {
        options = { mimeType: "audio/webm" };
      }

      const recorder = new MediaRecorder(stream, options);
      recorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());

        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        chunksRef.current = [];

        if (!saveEvidence) {
          setMessage("Rekaman selesai dan tidak disimpan. Yang disimpan cukup notulen/transkrip.");
          setLastUrl("");
          return;
        }

        await uploadEvidenceAudio(blob);
      };

      recorder.start(1000);
      setRecording(true);

      timerRef.current = setInterval(() => {
        setDuration((v) => v + 1);
      }, 1000);
    } catch (error) {
      alert("Gagal membuka mikrofon: " + error.message);
      setMessage("Mikrofon belum bisa dibuka.");
    }
  }

  function stopEvidenceRecording() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const recorder = recorderRef.current;

    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    }

    setRecording(false);
  }

  async function uploadEvidenceAudio(blob) {
    setBusy(true);
    setMessage("Mengupload rekaman bukti ke penyimpanan...");

    try {
      const fileName = "rekaman-rapat-" + new Date().toISOString().replace(/[:.]/g, "-") + ".webm";
      const file = new File([blob], fileName, { type: "audio/webm" });

      const form = new FormData();
      form.append("file", file);

      const r = await fetch("/api/media/upload", {
        method: "POST",
        headers: authHeaders(),
        body: form,
      });

      const result = await r.json();

      if (!result.ok) {
        throw new Error(result.detail || result.error || "Upload rekaman gagal.");
      }

      const item = {
        id: uid(),
        title: "Rekaman Bukti Rapat",
        meta: "Rapat - " + new Date().toLocaleDateString("id-ID"),
        mediaUrl: result.url,
        mediaPath: result.path,
        mediaType: "audio",
        mimeType: result.mimeType,
        size: result.size,
        originalName: result.name,
        createdAt: new Date().toISOString(),
        source: "meeting-evidence",
      };

      setData((prev) => ({
        ...prev,
        activities: [item, ...(prev.activities || [])],
      }));

      setLastUrl(result.url);
      setMessage("Rekaman bukti berhasil disimpan ke Galeri Aktivitas.");
    } catch (error) {
      setMessage("Gagal menyimpan rekaman bukti: " + error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card evidenceCard">
      <div className="sectionHead">
        <div>
          <h3>Perekam Bukti Audio Rapat</h3>
          <p>Default hemat: simpan notulen saja. Centang jika rapat penting dan audio perlu disimpan.</p>
        </div>
      </div>

      <label className="evidenceCheck">
        <input
          type="checkbox"
          checked={saveEvidence}
          onChange={(e) => setSaveEvidence(e.target.checked)}
          disabled={recording || busy}
        />
        <span>
          <b>Simpan rekaman audio sebagai bukti</b>
          <small>Gunakan hanya untuk rapat penting, pembinaan penting, atau kegiatan yang perlu arsip suara.</small>
        </span>
      </label>

      <div className="evidenceStatus">
        <div>
          <b>{recording ? "Sedang merekam" : "Tidak merekam"}</b>
          <span>Durasi: {formatTime(duration)}</span>
        </div>
        <div className={saveEvidence ? "evidenceBadge save" : "evidenceBadge"}>
          {saveEvidence ? "BUKTI DISIMPAN" : "HEMAT STORAGE"}
        </div>
      </div>

      <div className="evidenceActions">
        {!recording ? (
          <button className="btn primary" onClick={startEvidenceRecording} disabled={busy}>
            <Mic size={18} />
            Mulai Rekam Audio
          </button>
        ) : (
          <button className="btn danger" onClick={stopEvidenceRecording}>
            <Square size={18} />
            Stop Rekaman
          </button>
        )}
      </div>

      <div className="mediaHint">{message}</div>

      {lastUrl && (
        <div className="evidencePlayer">
          <audio src={lastUrl} controls />
        </div>
      )}
    </div>
  );
}

`;

if (!app.includes("function EvidenceAudioRecorder")) {
  const insertAt = app.indexOf("function MeetingsView");

  if (insertAt < 0) {
    throw new Error("function MeetingsView tidak ditemukan.");
  }

  app = app.slice(0, insertAt) + component + "\n" + app.slice(insertAt);
}

// Sisipkan komponen ke dalam menu Rapat, setelah TopBar pertama di MeetingsView
if (!app.includes("<EvidenceAudioRecorder data={data} setData={setData} />")) {
  const meetingIndex = app.indexOf("function MeetingsView");

  if (meetingIndex < 0) {
    throw new Error("function MeetingsView tidak ditemukan saat menyisipkan komponen.");
  }

  const topBarIndex = app.indexOf("<TopBar", meetingIndex);

  if (topBarIndex < 0) {
    throw new Error("TopBar di MeetingsView tidak ditemukan.");
  }

  const topBarEnd = app.indexOf("/>", topBarIndex);

  if (topBarEnd < 0) {
    throw new Error("Akhir TopBar di MeetingsView tidak ditemukan.");
  }

  const insertPos = topBarEnd + 2;
  const snippet = "\\n\\n      <EvidenceAudioRecorder data={data} setData={setData} />";

  app = app.slice(0, insertPos) + snippet + app.slice(insertPos);
}

if (!css.includes("EDUBRAIN AUDIO BUKTI V12.4")) {
  css += `

/* EDUBRAIN AUDIO BUKTI V12.4 */
.evidenceCard {
  margin-bottom: 16px;
  border: 1px solid rgba(15,118,110,.18);
  background:
    radial-gradient(circle at top left, rgba(20,184,166,.12), transparent 32%),
    rgba(255,255,255,.94);
}

.evidenceCheck {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  border-radius: 20px;
  padding: 14px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  cursor: pointer;
}

.evidenceCheck input {
  width: 20px;
  height: 20px;
  margin-top: 2px;
  accent-color: #0f766e;
}

.evidenceCheck b {
  display: block;
  color: #0f172a;
  font-size: 14px;
}

.evidenceCheck small {
  display: block;
  color: #64748b;
  margin-top: 4px;
  line-height: 1.45;
}

.evidenceStatus {
  margin-top: 12px;
  border-radius: 20px;
  padding: 13px 14px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.evidenceStatus b {
  display: block;
  color: #0f172a;
}

.evidenceStatus span {
  display: block;
  color: #64748b;
  font-size: 13px;
  margin-top: 3px;
}

.evidenceBadge {
  border-radius: 999px;
  padding: 8px 11px;
  font-size: 11px;
  font-weight: 900;
  background: #ecfeff;
  color: #0f766e;
  white-space: nowrap;
}

.evidenceBadge.save {
  background: #fff7ed;
  color: #c2410c;
}

.evidenceActions {
  margin-top: 12px;
  display: flex;
  gap: 10px;
}

.evidencePlayer {
  margin-top: 12px;
  border-radius: 18px;
  padding: 12px;
  background: #0f172a;
}

.evidencePlayer audio {
  width: 100%;
}

.btn.danger {
  background: #e11d48;
  color: white;
  border-color: #e11d48;
}

@media(max-width:900px) {
  .evidenceStatus {
    align-items: stretch;
    flex-direction: column;
  }

  .evidenceActions .btn {
    width: 100%;
  }
}
`;
}

fs.writeFileSync(appPath, app, "utf8");
fs.writeFileSync(cssPath, css, "utf8");

console.log("Patch V12.4.1 perekam bukti audio opsional selesai.");
