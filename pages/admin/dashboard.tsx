import { useState, useEffect, useCallback, FormEvent } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Slide } from "../../lib/types";

// ─────────── Sortable slide item ───────────
function SortableSlideItem({
  slide,
  index,
  onEdit,
  onDelete,
  onToggle,
}: {
  slide: Slide;
  index: number;
  onEdit: (s: Slide) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string, enabled: boolean) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: slide.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`slide-item ${isDragging ? "dragging" : ""}`}
    >
      <div className="slide-drag-handle" {...attributes} {...listeners} title="Drag untuk mengubah urutan">
        ⋮⋮
      </div>

      <div className="slide-order-badge">{index + 1}</div>

      <div className="slide-info">
        <div className="slide-title">{slide.title}</div>
        <div className="slide-url">{slide.url}</div>
      </div>

      <div className="slide-meta">
        <span className={`badge ${slide.enabled ? "badge-enabled" : "badge-disabled"}`}>
          {slide.enabled ? "Aktif" : "Nonaktif"}
        </span>

        <div className="slide-duration-badge">
          ⏱ {slide.duration}s
        </div>

        <label className="toggle-switch" title="Aktif/Nonaktif">
          <input
            type="checkbox"
            checked={slide.enabled}
            onChange={(e) => onToggle(slide.id, e.target.checked)}
          />
          <span className="toggle-slider" />
        </label>
      </div>

      <div className="slide-actions">
        <button
          className="btn btn-ghost btn-sm btn-icon"
          onClick={() => onEdit(slide)}
          title="Edit"
        >
          ✏️
        </button>
        <button
          className="btn btn-danger btn-sm btn-icon"
          onClick={() => onDelete(slide.id)}
          title="Hapus"
        >
          🗑️
        </button>
      </div>
    </div>
  );
}

// ─────────── Main dashboard ───────────
export default function Dashboard() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [slides, setSlides] = useState<Slide[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editSlide, setEditSlide] = useState<Slide | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"slides" | "settings">("slides");
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formUrl, setFormUrl] = useState("");
  const [formDuration, setFormDuration] = useState(30);
  const [formEnabled, setFormEnabled] = useState(true);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const pass = sessionStorage.getItem("admin_pass");
    if (!pass) {
      router.replace("/admin");
      return;
    }
    setPassword(pass);
  }, [router]);

  const fetchSlides = useCallback(async () => {
    const pass = sessionStorage.getItem("admin_pass");
    if (!pass) return;
    try {
      const res = await fetch("/api/admin", {
        headers: { "x-admin-password": pass },
      });
      if (res.status === 401) {
        sessionStorage.removeItem("admin_pass");
        router.replace("/admin");
        return;
      }
      const data = await res.json();
      setSlides(data.slides || []);
    } catch {
      showToast("Gagal memuat data", "error");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (password) fetchSlides();
  }, [password, fetchSlides]);

  function openAddModal() {
    setEditSlide(null);
    setFormTitle("");
    setFormUrl("");
    setFormDuration(30);
    setFormEnabled(true);
    setShowAddModal(true);
  }

  function openEditModal(slide: Slide) {
    setEditSlide(slide);
    setFormTitle(slide.title);
    setFormUrl(slide.url);
    setFormDuration(slide.duration);
    setFormEnabled(slide.enabled);
    setShowAddModal(true);
  }

  async function handleSaveSlide(e: FormEvent) {
    e.preventDefault();
    if (!formUrl.trim()) return showToast("URL tidak boleh kosong", "error");

    const body = {
      title: formTitle || "Untitled",
      url: formUrl.trim(),
      duration: Number(formDuration),
      enabled: formEnabled,
    };

    try {
      if (editSlide) {
        await fetch(`/api/admin?id=${editSlide.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", "x-admin-password": password },
          body: JSON.stringify(body),
        });
        showToast("Slide berhasil diperbarui");
      } else {
        await fetch("/api/admin?action=create", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-admin-password": password },
          body: JSON.stringify(body),
        });
        showToast("Slide berhasil ditambahkan");
      }
      setShowAddModal(false);
      fetchSlides();
    } catch {
      showToast("Gagal menyimpan slide", "error");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus slide ini?")) return;
    try {
      await fetch(`/api/admin?id=${id}`, {
        method: "DELETE",
        headers: { "x-admin-password": password },
      });
      showToast("Slide dihapus");
      fetchSlides();
    } catch {
      showToast("Gagal menghapus", "error");
    }
  }

  async function handleToggle(id: string, enabled: boolean) {
    try {
      await fetch(`/api/admin?id=${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-admin-password": password },
        body: JSON.stringify({ enabled }),
      });
      setSlides((prev) =>
        prev.map((s) => (s.id === id ? { ...s, enabled } : s))
      );
    } catch {
      showToast("Gagal mengubah status", "error");
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIdx = slides.findIndex((s) => s.id === active.id);
    const newIdx = slides.findIndex((s) => s.id === over.id);
    const reordered = arrayMove(slides, oldIdx, newIdx);
    setSlides(reordered);

    try {
      await fetch("/api/admin?action=reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-password": password },
        body: JSON.stringify({ orderedIds: reordered.map((s) => s.id) }),
      });
      showToast("Urutan disimpan");
    } catch {
      showToast("Gagal menyimpan urutan", "error");
    }
  }

  async function handleChangePassword(e: FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword)
      return showToast("Password tidak cocok", "error");
    if (newPassword.length < 4)
      return showToast("Password minimal 4 karakter", "error");
    try {
      const res = await fetch("/api/admin?action=change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-password": password },
        body: JSON.stringify({ newPassword }),
      });
      if (res.ok) {
        sessionStorage.setItem("admin_pass", newPassword);
        setPassword(newPassword);
        setShowPasswordModal(false);
        setNewPassword("");
        setConfirmPassword("");
        showToast("Password berhasil diubah");
      }
    } catch {
      showToast("Gagal mengubah password", "error");
    }
  }

  const totalDuration = slides
    .filter((s) => s.enabled)
    .reduce((sum, s) => sum + s.duration, 0);

  const activeCount = slides.filter((s) => s.enabled).length;

  return (
    <>
      <Head><title>Admin Dashboard — TV Slideshow</title></Head>

      {/* Toast */}
      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            zIndex: 9999,
            padding: "12px 20px",
            borderRadius: 10,
            background: toast.type === "success" ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
            border: `1px solid ${toast.type === "success" ? "rgba(16,185,129,0.4)" : "rgba(239,68,68,0.4)"}`,
            color: toast.type === "success" ? "var(--success)" : "var(--danger)",
            fontWeight: 600,
            fontSize: "0.875rem",
            backdropFilter: "blur(10px)",
          }}
        >
          {toast.type === "success" ? "✅" : "❌"} {toast.msg}
        </div>
      )}

      <div className="admin-layout">
        {/* Sidebar */}
        <nav className="admin-sidebar">
          <div className="sidebar-logo">
            <h1>📺 TV Slideshow</h1>
            <span>Dashboard Admin</span>
          </div>

          <div className="sidebar-nav">
            <button
              className={`sidebar-nav-item ${activeTab === "slides" ? "active" : ""}`}
              onClick={() => setActiveTab("slides")}
            >
              🎬 Kelola Slide
            </button>
            <button
              className={`sidebar-nav-item ${activeTab === "settings" ? "active" : ""}`}
              onClick={() => setActiveTab("settings")}
            >
              ⚙️ Pengaturan
            </button>

            <div className="divider" />

            <Link href="/" className="sidebar-nav-item" target="_blank">
              📺 Buka TV Player
            </Link>
          </div>

          <div className="sidebar-footer">
            <button
              className="sidebar-nav-item"
              onClick={() => {
                sessionStorage.removeItem("admin_pass");
                router.push("/admin");
              }}
            >
              🚪 Logout
            </button>
          </div>
        </nav>

        {/* Main content */}
        <main className="admin-main">
          {activeTab === "slides" && (
            <>
              <div className="admin-header">
                <h2>Kelola Slide</h2>
                <p>Tambah, edit, atur urutan dan durasi tampilan setiap link.</p>
              </div>

              {/* Stats */}
              <div className="stats-grid">
                <div className="stat-card">
                  <span className="stat-card-label">Total Slide</span>
                  <span className="stat-card-value">{slides.length}</span>
                  <span className="stat-card-sub">link terdaftar</span>
                </div>
                <div className="stat-card">
                  <span className="stat-card-label">Slide Aktif</span>
                  <span className="stat-card-value" style={{ color: "var(--success)" }}>
                    {activeCount}
                  </span>
                  <span className="stat-card-sub">ditampilkan di TV</span>
                </div>
                <div className="stat-card">
                  <span className="stat-card-label">Total Durasi</span>
                  <span className="stat-card-value" style={{ color: "var(--accent)" }}>
                    {totalDuration}s
                  </span>
                  <span className="stat-card-sub">per putaran slideshow</span>
                </div>
              </div>

              {/* Slide list */}
              <div className="card">
                <div className="section-header">
                  <span className="section-title">
                    🎬 Daftar Slide
                    <span style={{ fontWeight: 400, color: "var(--text-muted)", fontSize: "0.78rem" }}>
                      (drag untuk mengubah urutan)
                    </span>
                  </span>
                  <button className="btn btn-primary btn-sm" onClick={openAddModal}>
                    + Tambah Slide
                  </button>
                </div>

                {loading ? (
                  <div className="loading">
                    <div className="spinner" />
                    <span>Memuat...</span>
                  </div>
                ) : slides.length === 0 ? (
                  <div className="empty-state">
                    <div className="icon">📭</div>
                    <p>Belum ada slide. Tambahkan link pertama Anda!</p>
                    <button
                      className="btn btn-primary"
                      onClick={openAddModal}
                      style={{ marginTop: 12 }}
                    >
                      + Tambah Slide
                    </button>
                  </div>
                ) : (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={slides.map((s) => s.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="slide-list">
                        {slides.map((slide, idx) => (
                          <SortableSlideItem
                            key={slide.id}
                            slide={slide}
                            index={idx}
                            onEdit={openEditModal}
                            onDelete={handleDelete}
                            onToggle={handleToggle}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                )}
              </div>
            </>
          )}

          {activeTab === "settings" && (
            <>
              <div className="admin-header">
                <h2>Pengaturan</h2>
                <p>Konfigurasi password dan opsi lainnya.</p>
              </div>

              <div className="card" style={{ maxWidth: 480 }}>
                <div className="section-title" style={{ marginBottom: 20 }}>🔐 Keamanan</div>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginBottom: 20 }}>
                  Ubah password admin untuk melindungi akses ke dashboard ini.
                </p>
                <button className="btn btn-secondary" onClick={() => setShowPasswordModal(true)}>
                  🔑 Ubah Password Admin
                </button>
              </div>

              <div className="card" style={{ maxWidth: 480, marginTop: 16 }}>
                <div className="section-title" style={{ marginBottom: 20 }}>📺 Akses TV</div>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginBottom: 16 }}>
                  Buka URL berikut di Smart TV Anda (gunakan mode fullscreen/kiosk).
                </p>
                <div
                  style={{
                    background: "var(--bg-secondary)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    padding: "10px 14px",
                    fontFamily: "JetBrains Mono, monospace",
                    fontSize: "0.85rem",
                    color: "var(--accent)",
                    wordBreak: "break-all",
                  }}
                >
                  {typeof window !== "undefined" ? window.location.origin : "https://your-app.vercel.app"}/
                </div>
                <p style={{ color: "var(--text-muted)", fontSize: "0.75rem", marginTop: 8 }}>
                  💡 Tips: Gunakan browser dalam mode fullscreen (F11) untuk tampilan TV yang optimal.
                </p>
              </div>
            </>
          )}
        </main>
      </div>

      {/* Add/Edit Slide Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowAddModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">
                {editSlide ? "✏️ Edit Slide" : "➕ Tambah Slide Baru"}
              </span>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>✕</button>
            </div>

            <form onSubmit={handleSaveSlide}>
              <div className="form-group">
                <label className="form-label">Judul</label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="contoh: Dashboard Penjualan"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">URL *</label>
                <input
                  className="form-input"
                  type="url"
                  placeholder="https://..."
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                  required
                />
                <span className="form-hint">URL lengkap yang akan ditampilkan di TV</span>
              </div>

              <div className="form-group">
                <label className="form-label">Durasi Tampil (detik)</label>
                <input
                  className="form-input"
                  type="number"
                  min={5}
                  max={3600}
                  value={formDuration}
                  onChange={(e) => setFormDuration(Number(e.target.value))}
                />
                <span className="form-hint">Minimal 5 detik, maksimal 3600 detik (1 jam)</span>
              </div>

              <div className="form-group" style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={formEnabled}
                    onChange={(e) => setFormEnabled(e.target.checked)}
                  />
                  <span className="toggle-slider" />
                </label>
                <span style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                  {formEnabled ? "Aktif (ditampilkan di TV)" : "Nonaktif (disembunyikan)"}
                </span>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary">
                  {editSlide ? "💾 Simpan Perubahan" : "✅ Tambah Slide"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowPasswordModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">🔑 Ubah Password Admin</span>
              <button className="modal-close" onClick={() => setShowPasswordModal(false)}>✕</button>
            </div>

            <form onSubmit={handleChangePassword}>
              <div className="form-group">
                <label className="form-label">Password Baru</label>
                <input
                  className="form-input"
                  type="password"
                  placeholder="Min. 4 karakter"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label className="form-label">Konfirmasi Password</label>
                <input
                  className="form-input"
                  type="password"
                  placeholder="Ulangi password baru"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowPasswordModal(false)}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary">
                  🔐 Simpan Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
