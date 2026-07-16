import fs from "node:fs";

const appPath = "./src/App.jsx";
const cssPath = "./src/index.css";

let app = fs.readFileSync(appPath, "utf8");
let css = fs.readFileSync(cssPath, "utf8");

// Bersihkan kalimat yang rusak encoding di HP
app = app.replace(
  /Untuk tahap awal,[\s\S]*?jaringan sekolah\./g,
  "Untuk tahap awal, usahakan video maksimal sekitar 100 MB agar upload stabil di jaringan sekolah."
);

// Bersihkan deskripsi aktivitas agar tidak ada simbol rawan
app = app.replace(
  /Tambahkan dokumentasi foto,[\s\S]*?kegiatan sekolah\./g,
  "Tambahkan dokumentasi foto, video, atau rekaman kegiatan sekolah."
);

app = app.replace(
  /Foto, video presentasi siswa,[\s\S]*?guru\./g,
  "Foto, video presentasi siswa, rekaman kegiatan, atau video mengajar guru."
);

// Ganti simbol pemisah rawan encoding
app = app.replaceAll(" ±", " sekitar");
app = app.replaceAll("±", "sekitar");
app = app.replaceAll(" · ", " - ");
app = app.replaceAll("·", "-");

// Bersihkan sisa mojibake umum
app = app.replace(/[ÃÂÆƒâ€™€œ€]/g, "");
css = css.replace(/[ÃÂÆƒâ€™€œ€]/g, "");

if (!css.includes("EDUBRAIN MOBILE ANTI OVERFLOW V12.3")) {
  css += `

/* EDUBRAIN MOBILE ANTI OVERFLOW V12.3 */
html,
body,
#root {
  width: 100%;
  max-width: 100%;
  overflow-x: hidden;
}

* {
  box-sizing: border-box;
}

.main,
.card,
.grid2,
.sectionHead,
.activityPreview,
.activityManageList,
.installAppBox,
.homeSyncStrip {
  min-width: 0;
  max-width: 100%;
}

.card p,
.sectionHead p,
.mediaHint,
.itemSub,
.activityOverlay span,
.installSteps,
.installAppBox span {
  max-width: 100%;
  overflow-wrap: anywhere;
  word-break: normal;
}

.input,
textarea,
select,
button {
  max-width: 100%;
}

@media(max-width:900px) {
  .main {
    width: 100%;
    overflow-x: hidden;
  }

  .card {
    width: 100%;
    overflow: hidden;
  }

  .sectionHead {
    overflow: hidden;
  }

  .sectionHead p,
  .mediaHint {
    white-space: normal;
    line-height: 1.5;
  }
}
`;
}

fs.writeFileSync(appPath, app, "utf8");
fs.writeFileSync(cssPath, css, "utf8");

console.log("Patch bersih teks HP V12.3 selesai.");
