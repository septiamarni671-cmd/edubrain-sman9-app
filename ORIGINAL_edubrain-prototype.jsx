import React, { useState, useRef, useEffect } from "react";
import {
  LayoutDashboard,
  Mic,
  Brain,
  Settings,
  Upload,
  FileText,
  FileSpreadsheet,
  File,
  CheckCircle2,
  Circle,
  Send,
  Clock,
  Users,
  ChevronRight,
  Menu,
  X,
  Plus,
  Sparkles,
  Bell,
  LogOut,
  GraduationCap,
  AlertCircle,
  Loader2,
  Bot,
  User,
  PartyPopper,
  Radio,
} from "lucide-react";

// ---------- Mock data ----------

const initialMeetings = [
  {
    id: "m1",
    title: "Rapat Panitia Pensi 2026",
    category: "Kepanitiaan",
    date: "12 Jul 2026",
    time: "13.00 – 14.30",
    participants: 8,
    summary:
      'Panitia menyepakati tema "Cahaya Prestasi" untuk Pensi 2026. Venue utama adalah Aula Sekolah dengan kapasitas 500 kursi. Anggaran sementara Rp 45 juta, masih menunggu konfirmasi 2 sponsor tambahan. Gladi bersih dijadwalkan H-3 sebelum hari acara.',
    tasks: [
      { id: "t1", assignee: "Budi Santoso", initials: "BS", task: "Draf Proposal Sponsor", due: "Besok", urgency: "urgent", done: false },
      { id: "t2", assignee: "Rina Amelia", initials: "RA", task: "Booking Aula & Sound System", due: "3 hari lagi", urgency: "soon", done: false },
      { id: "t3", assignee: "Dedi Kurniawan", initials: "DK", task: "List Vendor Konsumsi", due: "Minggu depan", urgency: "normal", done: true },
      { id: "t4", assignee: "Sari Wulandari", initials: "SW", task: "Desain Backdrop Panggung", due: "5 hari lagi", urgency: "normal", done: false },
    ],
  },
  {
    id: "m2",
    title: "Rapat Pleno Wali Kelas",
    category: "Akademik",
    date: "10 Jul 2026",
    time: "09.00 – 10.30",
    participants: 15,
    summary:
      "Evaluasi tengah semester menunjukkan 3 siswa dengan tingkat absensi tinggi yang memerlukan tindak lanjut. Wali kelas sepakat mengirim surat panggilan orang tua bagi siswa dengan alpha lebih dari 3 kali. Rekap nilai UTS ditargetkan selesai akhir minggu ini.",
    tasks: [
      { id: "t5", assignee: "Pak Anton", initials: "PA", task: "Rekap Nilai UTS Kelas 10A", due: "Hari ini", urgency: "urgent", done: false },
      { id: "t6", assignee: "Bu Maya", initials: "BM", task: "Surat Panggilan Orang Tua Andi", due: "Besok", urgency: "urgent", done: false },
      { id: "t7", assignee: "Pak Joko", initials: "PJ", task: "Update Data Absensi Semester", due: "2 hari lagi", urgency: "soon", done: true },
    ],
  },
  {
    id: "m3",
    title: "Rapat Koordinasi Ekstrakurikuler",
    category: "Kesiswaan",
    date: "5 Jul 2026",
    time: "14.00 – 15.00",
    participants: 6,
    summary:
      "Jadwal latihan ekstrakurikuler semester baru telah disusun. Pembina Pramuka dan Futsal sepakat menghindari bentrok jadwal setiap Jumat sore. Anggaran peralatan baru sudah diajukan ke bagian sarana prasarana.",
    tasks: [
      { id: "t8", assignee: "Pak Rudi", initials: "PR", task: "Ajukan Anggaran Peralatan", due: "Selesai", urgency: "normal", done: true },
      { id: "t9", assignee: "Bu Wati", initials: "BW", task: "Susun Jadwal Latihan Final", due: "Selesai", urgency: "normal", done: true },
    ],
  },
];

const initialDocuments = [
  { id: "d1", name: "RPP Biologi Kelas 10.pdf", type: "pdf", size: "2.4 MB", updated: "3 hari lalu" },
  { id: "d2", name: "Rekap Absensi Siswa.xlsx", type: "sheet", size: "860 KB", updated: "1 hari lalu" },
  { id: "d3", name: "Buku Tata Tertib Sekolah.pdf", type: "pdf", size: "1.1 MB", updated: "2 minggu lalu" },
  { id: "d4", name: "Silabus Matematika Kelas 11.docx", type: "doc", size: "540 KB", updated: "5 hari lalu" },
  { id: "d5", name: "Proposal Pensi 2026.pdf", type: "pdf", size: "3.2 MB", updated: "Hari ini" },
];

const initialChat = [
  {
    id: "c1",
    role: "user",
    text: "Berdasarkan pedoman sekolah, buatkan draf SP1 untuk Andi yang bolos 4 kali.",
  },
  {
    id: "c2",
    role: "ai",
    text: 'Tentu, berikut draf Surat Peringatan 1 (SP1) berdasarkan ketentuan yang berlaku: siswa atas nama Andi tercatat alpha 4 kali dalam satu bulan terakhir, melebihi batas toleransi 3 kali. Draf mencantumkan poin pelanggaran, konsekuensi sesuai tingkatannya, dan permintaan kehadiran orang tua/wali paling lambat 3 hari kerja sejak surat diterbitkan.',
    citations: ["Buku Tata Tertib Sekolah.pdf · Bab 2 Pasal 4"],
  },
];

function generateAiReply(question) {
  const q = question.toLowerCase();
  if (q.includes("sp") || q.includes("bolos") || q.includes("alpha") || q.includes("disiplin") || q.includes("tertib")) {
    return {
      text: "Berikut poin ketentuan disiplin yang relevan, lengkap dengan draf surat yang tinggal Anda sesuaikan dengan nama dan jenis pelanggaran siswa.",
      citations: ["Buku Tata Tertib Sekolah.pdf · Bab 2"],
    };
  }
  if (q.includes("silabus") || q.includes("rpp") || q.includes("materi") || q.includes("ajar")) {
    return {
      text: "Saya menemukan rencana pembelajaran yang relevan. Berikut capaian pembelajaran dan alokasi waktu yang sudah tersusun di dokumen Anda.",
      citations: ["Silabus Matematika Kelas 11.docx"],
    };
  }
  if (q.includes("absen") || q.includes("hadir") || q.includes("bolos")) {
    return {
      text: "Berdasarkan rekap terbaru, berikut ringkasan tingkat kehadiran yang perlu ditindaklanjuti minggu ini.",
      citations: ["Rekap Absensi Siswa.xlsx"],
    };
  }
  if (q.includes("proposal") || q.includes("sponsor") || q.includes("pensi") || q.includes("acara")) {
    return {
      text: "Berikut poin utama yang sudah disepakati panitia, siap Anda kembangkan menjadi draf proposal yang lebih lengkap.",
      citations: ["Proposal Pensi 2026.pdf"],
    };
  }
  return {
    text: "Saya belum menemukan referensi spesifik untuk itu di dokumen Anda. Coba unggah dokumen terkait, atau gunakan kata kunci yang lebih spesifik.",
    citations: [],
  };
}

// ---------- Small building blocks ----------

const urgencyStyles = {
  urgent: { dot: "bg-rose-400", border: "border-l-rose-400", badge: "bg-rose-50 text-rose-600", avatar: "bg-rose-100 text-rose-700" },
  soon: { dot: "bg-amber-400", border: "border-l-amber-400", badge: "bg-amber-50 text-amber-700", avatar: "bg-amber-100 text-amber-700" },
  normal: { dot: "bg-blue-400", border: "border-l-blue-300", badge: "bg-blue-50 text-blue-600", avatar: "bg-blue-100 text-blue-700" },
};

function ProgressRing({ percent, size = 40 }) {
  const deg = Math.round((percent / 100) * 360);
  const color = percent === 100 ? "#10b981" : percent >= 50 ? "#3b82f6" : "#f59e0b";
  return (
    <div
      className="relative shrink-0 rounded-full"
      style={{
        width: size,
        height: size,
        background: `conic-gradient(${color} ${deg}deg, #e5e7eb ${deg}deg)`,
      }}
    >
      <div className="absolute inset-[3px] rounded-full bg-white flex items-center justify-center">
        <span className="text-[10px] font-semibold text-slate-600">{percent}%</span>
      </div>
    </div>
  );
}

function DocIcon({ type, className }) {
  if (type === "sheet") return <FileSpreadsheet className={className} />;
  if (type === "doc") return <File className={className} />;
  return <FileText className={className} />;
}

function EmptyState({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-6">
      <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-slate-400" />
      </div>
      <p className="font-semibold text-slate-700">{title}</p>
      {subtitle && <p className="text-sm text-slate-400 mt-1 max-w-xs">{subtitle}</p>}
    </div>
  );
}

// ---------- Sidebar ----------

function Sidebar({ activeView, setActiveView, sidebarOpen, setSidebarOpen }) {
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "meetings", label: "Rapat Cerdas", icon: Mic },
    { id: "brain", label: "Otak Kedua", icon: Brain },
    { id: "settings", label: "Pengaturan", icon: Settings },
  ];

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/30 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside
        className={`fixed z-40 md:z-auto top-0 left-0 h-full w-64 bg-white border-r border-slate-100 flex flex-col transition-transform duration-300 ease-out md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-5 h-16 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500 flex items-center justify-center shadow-sm shadow-blue-200">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-slate-800 leading-none tracking-tight">EduBrain</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Asisten guru cerdas</p>
            </div>
          </div>
          <button className="md:hidden text-slate-400" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-5 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveView(item.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150 ${
                  active
                    ? "bg-blue-50 text-blue-600"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                }`}
              >
                <Icon className={`w-[18px] h-[18px] ${active ? "text-blue-500" : "text-slate-400"}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-slate-100">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-semibold">
              SN
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-700 truncate">Bu Siti Nurhaliza</p>
              <p className="text-xs text-slate-400 truncate">Wali Kelas 9A</p>
            </div>
            <LogOut className="w-4 h-4 text-slate-300" />
          </div>
        </div>
      </aside>
    </>
  );
}

function TopBar({ title, subtitle, setSidebarOpen }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <button
          className="md:hidden w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-semibold text-slate-800 tracking-tight">{title}</h1>
          {subtitle && <p className="text-sm text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      <button className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors">
        <Bell className="w-4 h-4" />
      </button>
    </div>
  );
}

// ---------- Dashboard ----------

function DashboardView({ meetings, documents, toggleTask, setActiveView, setSidebarOpen }) {
  const hour = new Date().getHours();
  const greeting = hour < 11 ? "Selamat pagi" : hour < 15 ? "Selamat siang" : hour < 18 ? "Selamat sore" : "Selamat malam";

  const allTasks = meetings.flatMap((m) => m.tasks.map((t) => ({ ...t, meetingTitle: m.title, meetingId: m.id })));
  const activeTasks = allTasks.filter((t) => !t.done);
  const urgentFirst = [...activeTasks].sort((a, b) => {
    const rank = { urgent: 0, soon: 1, normal: 2 };
    return rank[a.urgency] - rank[b.urgency];
  });

  const stats = [
    { label: "Rapat Bulan Ini", value: meetings.length, icon: Mic, color: "text-blue-500", bg: "bg-blue-50" },
    { label: "Tugas Aktif", value: activeTasks.length, icon: AlertCircle, color: "text-amber-500", bg: "bg-amber-50" },
    { label: "Dokumen Tersimpan", value: documents.length, icon: FileText, color: "text-emerald-500", bg: "bg-emerald-50" },
  ];

  return (
    <div>
      <TopBar title={`${greeting}, Bu Siti`} subtitle="Ini ringkasan aktivitas Anda hari ini." setSidebarOpen={setSidebarOpen} />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-md hover:shadow-slate-100 transition-shadow duration-200">
              <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                <Icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <p className="text-2xl font-semibold text-slate-800 tracking-tight">{s.value}</p>
              <p className="text-sm text-slate-400 mt-0.5">{s.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-700">Tugas Mendesak</h2>
            <button onClick={() => setActiveView("meetings")} className="text-sm text-blue-500 hover:text-blue-600 flex items-center gap-1">
              Lihat semua <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          {urgentFirst.length === 0 ? (
            <EmptyState icon={PartyPopper} title="Semua tugas sudah selesai" subtitle="Tidak ada tugas aktif yang perlu dikejar saat ini." />
          ) : (
            <div className="space-y-2">
              {urgentFirst.slice(0, 4).map((t) => {
                const s = urgencyStyles[t.urgency];
                return (
                  <div key={t.id} className={`flex items-center gap-3 p-3 rounded-xl border-l-4 ${s.border} bg-slate-50/60 hover:bg-slate-50 transition-colors`}>
                    <button onClick={() => toggleTask(t.meetingId, t.id)} className="text-slate-300 hover:text-emerald-500 transition-colors">
                      <Circle className="w-5 h-5" />
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-700 truncate">{t.task}</p>
                      <p className="text-xs text-slate-400 truncate">{t.assignee} · {t.meetingTitle}</p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap ${s.badge}`}>{t.due}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h2 className="font-semibold text-slate-700 mb-4">Aksi Cepat</h2>
          <div className="space-y-3">
            <button
              onClick={() => setActiveView("meetings")}
              className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-blue-500 text-white hover:bg-blue-600 transition-colors shadow-sm shadow-blue-200"
            >
              <Mic className="w-4 h-4" />
              <span className="text-sm font-medium">Rekam Rapat Baru</span>
            </button>
            <button
              onClick={() => setActiveView("brain")}
              className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <Brain className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-medium">Buka Otak Kedua</span>
            </button>
          </div>

          <div className="mt-5 pt-5 border-t border-slate-100">
            <p className="text-xs font-medium text-slate-400 mb-3 uppercase tracking-wide">Rapat Terbaru</p>
            <div className="space-y-2">
              {meetings.slice(0, 2).map((m) => (
                <div key={m.id} className="text-sm text-slate-600 flex items-center justify-between">
                  <span className="truncate">{m.title}</span>
                  <span className="text-xs text-slate-400 whitespace-nowrap ml-2">{m.date}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- Smart Meetings ----------

function MeetingsView({ meetings, setMeetings, selectedId, setSelectedId, toggleTask, setSidebarOpen }) {
  const [isRecording, setIsRecording] = useState(false);
  const selected = meetings.find((m) => m.id === selectedId) || meetings[0];

  function handleRecordNew() {
    if (isRecording) return;
    setIsRecording(true);
    setTimeout(() => {
      const id = "m" + Date.now();
      const newMeeting = {
        id,
        title: "Rapat Koordinasi Baru",
        category: "Kepanitiaan",
        date: "Hari ini",
        time: "Baru saja",
        participants: 5,
        summary:
          "Ringkasan otomatis sedang dibuat dari rekaman audio Anda. Poin utama pembahasan dan daftar tugas akan muncul di sini begitu proses transkripsi selesai.",
        tasks: [
          { id: "nt1", assignee: "Anda", initials: "AN", task: "Tinjau ringkasan otomatis", due: "Hari ini", urgency: "soon", done: false },
        ],
      };
      setMeetings((prev) => [newMeeting, ...prev]);
      setSelectedId(id);
      setIsRecording(false);
    }, 2200);
  }

  const doneCount = selected.tasks.filter((t) => t.done).length;
  const pct = Math.round((doneCount / selected.tasks.length) * 100);

  return (
    <div>
      <TopBar title="Rapat Cerdas" subtitle="Rekam rapat, biarkan AI meringkas dan menyusun tugasnya." setSidebarOpen={setSidebarOpen} />

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <button
          onClick={handleRecordNew}
          disabled={isRecording}
          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-500 text-white font-medium text-sm hover:bg-blue-600 transition-colors shadow-sm shadow-blue-200 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isRecording ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mic className="w-4 h-4" />}
          {isRecording ? "Memproses rekaman…" : "Rekam Rapat Baru"}
        </button>
        <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-slate-200 text-slate-600 font-medium text-sm hover:bg-slate-50 transition-colors">
          <Upload className="w-4 h-4" />
          Upload Audio
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6">
        {/* Meeting list */}
        <div className="bg-white rounded-2xl border border-slate-100 p-3">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wide px-2 py-2">Rapat Terbaru</p>
          <div className="space-y-1.5 max-h-[560px] overflow-y-auto pr-1">
            {isRecording && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-rose-50 text-rose-600 text-sm mb-1">
                <Radio className="w-4 h-4 animate-pulse" />
                Merekam & memproses audio…
              </div>
            )}
            {meetings.map((m) => {
              const d = m.tasks.filter((t) => t.done).length;
              const p = Math.round((d / m.tasks.length) * 100);
              const active = selected.id === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setSelectedId(m.id)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-colors duration-150 ${
                    active ? "bg-blue-50 border-blue-200" : "border-transparent hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <ProgressRing percent={p} size={38} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-700 truncate">{m.title}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{m.date}</span>
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" />{m.participants}</span>
                      </div>
                      <span className="inline-block mt-2 text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                        {m.category}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Detail panel */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-400 mb-1">
            <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{selected.date} · {selected.time}</span>
            <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" />{selected.participants} peserta</span>
          </div>
          <h2 className="text-lg font-semibold text-slate-800 tracking-tight mb-4">{selected.title}</h2>

          <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <p className="text-sm font-semibold text-emerald-700">Ringkasan AI</p>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">{selected.summary}</p>
          </div>

          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-slate-700">Tugas yang Diekstrak Otomatis</h3>
            <span className="text-xs text-slate-400">{doneCount}/{selected.tasks.length} selesai</span>
          </div>

          <div className="w-full h-1.5 bg-slate-100 rounded-full mb-4 overflow-hidden">
            <div className="h-full bg-emerald-400 transition-all duration-500 rounded-full" style={{ width: `${pct}%` }} />
          </div>

          {selected.tasks.every((t) => t.done) ? (
            <EmptyState icon={PartyPopper} title="Semua tugas rapat ini sudah selesai" subtitle="Kerja bagus! Tidak ada tindak lanjut yang tertunda." />
          ) : (
            <div className="space-y-2">
              {selected.tasks.map((t) => {
                const s = urgencyStyles[t.urgency];
                return (
                  <div
                    key={t.id}
                    className={`flex items-start gap-3 p-3.5 rounded-xl border-l-4 ${s.border} ${
                      t.done ? "bg-slate-50/50 opacity-60" : "bg-slate-50/60"
                    } hover:bg-slate-50 transition-colors`}
                  >
                    <button onClick={() => toggleTask(selected.id, t.id)} className="mt-0.5 text-slate-300 hover:text-emerald-500 transition-colors shrink-0">
                      {t.done ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Circle className="w-5 h-5" />}
                    </button>
                    <div className={`w-8 h-8 rounded-full ${s.avatar} flex items-center justify-center text-[11px] font-semibold shrink-0`}>
                      {t.initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-medium text-slate-700 ${t.done ? "line-through" : ""}`}>{t.task}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{t.assignee}</p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap ${s.badge}`}>{t.due}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------- Second Brain ----------

function SecondBrainView({ documents, setDocuments, chatMessages, setChatMessages, setSidebarOpen }) {
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [chatMessages, isTyping]);

  function handleUpload() {
    const names = ["Catatan Rapat Orang Tua.pdf", "Jadwal Ujian Semester.xlsx", "Panduan Ekstrakurikuler.docx"];
    const name = names[Math.floor(Math.random() * names.length)];
    const type = name.endsWith(".xlsx") ? "sheet" : name.endsWith(".docx") ? "doc" : "pdf";
    setDocuments((prev) => [{ id: "d" + Date.now(), name, size: "1.2 MB", updated: "Baru saja", type }, ...prev]);
  }

  function handleSend() {
    if (!input.trim()) return;
    const userMsg = { id: "c" + Date.now(), role: "user", text: input.trim() };
    setChatMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);
    setTimeout(() => {
      const reply = generateAiReply(userMsg.text);
      setChatMessages((prev) => [...prev, { id: "c" + Date.now() + 1, role: "ai", ...reply }]);
      setIsTyping(false);
    }, 1300);
  }

  return (
    <div>
      <TopBar title="Otak Kedua" subtitle="Simpan dokumen sekolah, lalu tanyakan apa saja." setSidebarOpen={setSidebarOpen} />

      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6">
        {/* Document vault */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 flex flex-col">
          <div className="flex items-center justify-between mb-3 px-1">
            <p className="font-semibold text-slate-700 text-sm">Document Vault</p>
            <button
              onClick={handleUpload}
              className="flex items-center gap-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Upload
            </button>
          </div>
          {documents.length === 0 ? (
            <EmptyState icon={FileText} title="Belum ada dokumen" subtitle="Unggah dokumen pertama Anda untuk mulai bertanya." />
          ) : (
            <div className="space-y-1.5 max-h-[520px] overflow-y-auto">
              {documents.map((d) => (
                <div key={d.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors cursor-default">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                    <DocIcon type={d.type} className="w-4 h-4 text-slate-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-700 truncate">{d.name}</p>
                    <p className="text-xs text-slate-400">{d.size} · {d.updated}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Chat with docs */}
        <div className="bg-white rounded-2xl border border-slate-100 flex flex-col h-[600px]">
          <div className="px-5 py-4 border-b border-slate-100">
            <p className="font-semibold text-slate-700 text-sm flex items-center gap-2">
              <Bot className="w-4 h-4 text-emerald-500" /> Tanya Dokumen Anda
            </p>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {chatMessages.map((m) => (
              <div key={m.id} className={`flex gap-2.5 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                {m.role === "ai" && (
                  <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                )}
                <div className={`max-w-[80%] ${m.role === "user" ? "order-1" : ""}`}>
                  <div
                    className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      m.role === "user" ? "bg-blue-500 text-white rounded-tr-sm" : "bg-slate-100 text-slate-700 rounded-tl-sm"
                    }`}
                  >
                    {m.text}
                  </div>
                  {m.citations && m.citations.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {m.citations.map((c, i) => (
                        <span key={i} className="flex items-center gap-1 text-[11px] font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                          <FileText className="w-3 h-3" /> {c}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                {m.role === "user" && (
                  <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-0.5 order-2">
                    <User className="w-3.5 h-3.5 text-blue-600" />
                  </div>
                )}
              </div>
            ))}
            {isTyping && (
              <div className="flex gap-2.5 justify-start">
                <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <div className="bg-slate-100 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
          </div>

          <div className="p-3 border-t border-slate-100 flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Tanyakan sesuatu tentang dokumen Anda…"
              className="flex-1 text-sm px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition-shadow"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="w-10 h-10 rounded-xl bg-blue-500 text-white flex items-center justify-center hover:bg-blue-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- Settings ----------

function ToggleSwitch({ checked, onChange }) {
  return (
    <button
      onClick={onChange}
      className={`w-11 h-6 rounded-full transition-colors duration-200 relative shrink-0 ${checked ? "bg-blue-500" : "bg-slate-200"}`}
    >
      <span
        className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${
          checked ? "translate-x-[22px]" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

function SettingsView({ setSidebarOpen }) {
  const [notifSummary, setNotifSummary] = useState(true);
  const [notifTasks, setNotifTasks] = useState(true);
  const [role, setRole] = useState("Wali Kelas");

  return (
    <div>
      <TopBar title="Pengaturan" subtitle="Kelola profil dan preferensi Anda." setSidebarOpen={setSidebarOpen} />

      <div className="max-w-2xl space-y-5">
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h2 className="font-semibold text-slate-700 mb-4">Profil</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1.5 block">Nama Lengkap</label>
              <input
                defaultValue="Siti Nurhaliza"
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1.5 block">Peran</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white"
              >
                <option>Wali Kelas</option>
                <option>Guru Mata Pelajaran</option>
                <option>Panitia Acara</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h2 className="font-semibold text-slate-700 mb-4">Notifikasi</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-700">Ringkasan rapat</p>
                <p className="text-xs text-slate-400">Kirim ringkasan AI setiap rapat selesai diproses</p>
              </div>
              <ToggleSwitch checked={notifSummary} onChange={() => setNotifSummary((v) => !v)} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-700">Pengingat tugas</p>
                <p className="text-xs text-slate-400">Ingatkan saya untuk tugas yang mendekati tenggat</p>
              </div>
              <ToggleSwitch checked={notifTasks} onChange={() => setNotifTasks((v) => !v)} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h2 className="font-semibold text-slate-700 mb-4">Tampilan</h2>
          <p className="text-sm text-slate-400 mb-3">Palet warna tenang, dirancang agar nyaman digunakan sepanjang hari.</p>
          <div className="flex gap-2">
            <span className="w-8 h-8 rounded-full bg-blue-400 border-2 border-white ring-1 ring-slate-200" />
            <span className="w-8 h-8 rounded-full bg-emerald-400 border-2 border-white ring-1 ring-slate-200" />
            <span className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white ring-1 ring-slate-200" />
            <span className="w-8 h-8 rounded-full bg-amber-300 border-2 border-white ring-1 ring-slate-200" />
          </div>
        </div>

        <button className="flex items-center gap-2 text-sm font-medium text-rose-500 hover:text-rose-600 px-1 py-2 transition-colors">
          <LogOut className="w-4 h-4" /> Keluar
        </button>
      </div>
    </div>
  );
}

// ---------- App ----------

export default function EduBrainApp() {
  const [activeView, setActiveView] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [meetings, setMeetings] = useState(initialMeetings);
  const [selectedMeetingId, setSelectedMeetingId] = useState(initialMeetings[0].id);
  const [documents, setDocuments] = useState(initialDocuments);
  const [chatMessages, setChatMessages] = useState(initialChat);

  function toggleTask(meetingId, taskId) {
    setMeetings((prev) =>
      prev.map((m) =>
        m.id === meetingId
          ? { ...m, tasks: m.tasks.map((t) => (t.id === taskId ? { ...t, done: !t.done } : t)) }
          : m
      )
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex">
      <Sidebar activeView={activeView} setActiveView={setActiveView} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <main className="flex-1 md:ml-64 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
        {activeView === "dashboard" && (
          <DashboardView
            meetings={meetings}
            documents={documents}
            toggleTask={toggleTask}
            setActiveView={setActiveView}
            setSidebarOpen={setSidebarOpen}
          />
        )}
        {activeView === "meetings" && (
          <MeetingsView
            meetings={meetings}
            setMeetings={setMeetings}
            selectedId={selectedMeetingId}
            setSelectedId={setSelectedMeetingId}
            toggleTask={toggleTask}
            setSidebarOpen={setSidebarOpen}
          />
        )}
        {activeView === "brain" && (
          <SecondBrainView
            documents={documents}
            setDocuments={setDocuments}
            chatMessages={chatMessages}
            setChatMessages={setChatMessages}
            setSidebarOpen={setSidebarOpen}
          />
        )}
        {activeView === "settings" && <SettingsView setSidebarOpen={setSidebarOpen} />}
      </main>
    </div>
  );
}
