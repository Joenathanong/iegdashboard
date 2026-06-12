import type { NextApiRequest, NextApiResponse } from "next";
import { readConfig } from "../../lib/storage";
import { Slide } from "../../lib/types";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    const config = readConfig();
    const activeSlides = config.slides
      .filter((s: Slide) => s.enabled)
      .sort((a: Slide, b: Slide) => a.order - b.order);
    return res.status(200).json({ slides: activeSlides });
  }
  return res.status(405).json({ error: "Method not allowed" });
}
