import type { NextApiRequest, NextApiResponse } from "next";
import { initializeApp, getApps, getApp, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { v4 as uuidv4 } from "uuid";

function getAdminDb() {
  const app =
    getApps().length > 0
      ? getApp()
      : initializeApp({
          credential: cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
          }),
        });
  return getFirestore(app);
}

const ADMIN_PASS_DOC = "config/admin";

async function getAdminPassword(db: FirebaseFirestore.Firestore): Promise<string> {
  try {
    const doc = await db.doc(ADMIN_PASS_DOC).get();
    return doc.exists ? (doc.data()?.password ?? "admin123") : "admin123";
  } catch {
    return "admin123";
  }
}

async function checkAuth(req: NextApiRequest, db: FirebaseFirestore.Firestore): Promise<boolean> {
  const auth = req.headers["x-admin-password"] as string;
  const stored = await getAdminPassword(db);
  return auth === stored;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const db = getAdminDb();

  // ── LOGIN ──
  if (req.method === "POST" && req.query.action === "login") {
    const { password } = req.body;
    const stored = await getAdminPassword(db);
    if (password === stored) return res.status(200).json({ success: true });
    return res.status(401).json({ error: "Invalid password" });
  }

  // ── GET ALL (admin) ──
  if (req.method === "GET") {
    if (!(await checkAuth(req, db))) return res.status(401).json({ error: "Unauthorized" });
    const snap = await db.collection("slides").orderBy("order", "asc").get();
    const slides = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return res.status(200).json({ slides });
  }

  // ── CREATE ──
  if (req.method === "POST" && req.query.action === "create") {
    if (!(await checkAuth(req, db))) return res.status(401).json({ error: "Unauthorized" });
    const { title, url, duration, enabled } = req.body;

    // get max order
    const snap = await db.collection("slides").orderBy("order", "desc").limit(1).get();
    const maxOrder = snap.empty ? -1 : (snap.docs[0].data().order ?? -1);

    const id = uuidv4();
    const newSlide = {
      title: title || "Untitled",
      url,
      duration: Number(duration) || 30,
      enabled: enabled !== false,
      order: maxOrder + 1,
      createdAt: new Date().toISOString(),
    };
    await db.collection("slides").doc(id).set(newSlide);
    return res.status(201).json({ slide: { id, ...newSlide } });
  }

  // ── UPDATE ──
  if (req.method === "PUT") {
    if (!(await checkAuth(req, db))) return res.status(401).json({ error: "Unauthorized" });
    const { id } = req.query as { id: string };
    const { title, url, duration, enabled } = req.body;
    const updates: Record<string, any> = {};
    if (title !== undefined) updates.title = title;
    if (url !== undefined) updates.url = url;
    if (duration !== undefined) updates.duration = Number(duration);
    if (enabled !== undefined) updates.enabled = enabled;
    await db.collection("slides").doc(id).update(updates);
    const updated = await db.collection("slides").doc(id).get();
    return res.status(200).json({ slide: { id, ...updated.data() } });
  }

  // ── DELETE ──
  if (req.method === "DELETE") {
    if (!(await checkAuth(req, db))) return res.status(401).json({ error: "Unauthorized" });
    const { id } = req.query as { id: string };
    await db.collection("slides").doc(id).delete();

    // re-order remaining
    const snap = await db.collection("slides").orderBy("order", "asc").get();
    const batch = db.batch();
    snap.docs.forEach((doc, i) => batch.update(doc.ref, { order: i }));
    await batch.commit();
    return res.status(200).json({ success: true });
  }

  // ── REORDER ──
  if (req.method === "POST" && req.query.action === "reorder") {
    if (!(await checkAuth(req, db))) return res.status(401).json({ error: "Unauthorized" });
    const { orderedIds } = req.body as { orderedIds: string[] };
    const batch = db.batch();
    orderedIds.forEach((id, index) => {
      batch.update(db.collection("slides").doc(id), { order: index });
    });
    await batch.commit();
    return res.status(200).json({ success: true });
  }

  // ── CHANGE PASSWORD ──
  if (req.method === "POST" && req.query.action === "change-password") {
    if (!(await checkAuth(req, db))) return res.status(401).json({ error: "Unauthorized" });
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 4)
      return res.status(400).json({ error: "Password minimal 4 karakter" });
    await db.doc(ADMIN_PASS_DOC).set({ password: newPassword }, { merge: true });
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
