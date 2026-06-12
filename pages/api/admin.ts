import type { NextApiRequest, NextApiResponse } from "next";
import { readConfig, writeConfig } from "../../lib/storage";
import { Slide } from "../../lib/types";
import { v4 as uuidv4 } from "uuid";

function checkAuth(req: NextApiRequest): boolean {
  const config = readConfig();
  const auth = req.headers["x-admin-password"] as string;
  return auth === config.adminPassword;
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // LOGIN CHECK
  if (req.method === "POST" && req.query.action === "login") {
    const config = readConfig();
    const { password } = req.body;
    if (password === config.adminPassword) {
      return res.status(200).json({ success: true });
    }
    return res.status(401).json({ error: "Invalid password" });
  }

  // GET ALL SLIDES (admin view, including disabled)
  if (req.method === "GET") {
    if (!checkAuth(req)) return res.status(401).json({ error: "Unauthorized" });
    const config = readConfig();
    const sorted = [...config.slides].sort((a, b) => a.order - b.order);
    return res.status(200).json({ slides: sorted });
  }

  // CREATE SLIDE
  if (req.method === "POST" && req.query.action === "create") {
    if (!checkAuth(req)) return res.status(401).json({ error: "Unauthorized" });
    const config = readConfig();
    const { title, url, duration, enabled } = req.body;
    const maxOrder = config.slides.reduce(
      (max: number, s: Slide) => Math.max(max, s.order),
      -1
    );
    const newSlide: Slide = {
      id: uuidv4(),
      title: title || "Untitled",
      url,
      duration: Number(duration) || 30,
      enabled: enabled !== false,
      order: maxOrder + 1,
      createdAt: new Date().toISOString(),
    };
    config.slides.push(newSlide);
    config.lastUpdated = new Date().toISOString();
    writeConfig(config);
    return res.status(201).json({ slide: newSlide });
  }

  // UPDATE SLIDE
  if (req.method === "PUT") {
    if (!checkAuth(req)) return res.status(401).json({ error: "Unauthorized" });
    const config = readConfig();
    const { id } = req.query;
    const idx = config.slides.findIndex((s: Slide) => s.id === id);
    if (idx === -1) return res.status(404).json({ error: "Not found" });
    config.slides[idx] = { ...config.slides[idx], ...req.body };
    config.lastUpdated = new Date().toISOString();
    writeConfig(config);
    return res.status(200).json({ slide: config.slides[idx] });
  }

  // DELETE SLIDE
  if (req.method === "DELETE") {
    if (!checkAuth(req)) return res.status(401).json({ error: "Unauthorized" });
    const config = readConfig();
    const { id } = req.query;
    config.slides = config.slides.filter((s: Slide) => s.id !== id);
    // Re-order
    config.slides
      .sort((a: Slide, b: Slide) => a.order - b.order)
      .forEach((s: Slide, i: number) => {
        s.order = i;
      });
    config.lastUpdated = new Date().toISOString();
    writeConfig(config);
    return res.status(200).json({ success: true });
  }

  // REORDER SLIDES
  if (req.method === "POST" && req.query.action === "reorder") {
    if (!checkAuth(req)) return res.status(401).json({ error: "Unauthorized" });
    const config = readConfig();
    const { orderedIds } = req.body as { orderedIds: string[] };
    orderedIds.forEach((id: string, index: number) => {
      const slide = config.slides.find((s: Slide) => s.id === id);
      if (slide) slide.order = index;
    });
    config.lastUpdated = new Date().toISOString();
    writeConfig(config);
    return res.status(200).json({ success: true });
  }

  // CHANGE PASSWORD
  if (req.method === "POST" && req.query.action === "change-password") {
    if (!checkAuth(req)) return res.status(401).json({ error: "Unauthorized" });
    const config = readConfig();
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 4)
      return res
        .status(400)
        .json({ error: "Password must be at least 4 characters" });
    config.adminPassword = newPassword;
    config.lastUpdated = new Date().toISOString();
    writeConfig(config);
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
