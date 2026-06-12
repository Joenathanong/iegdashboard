import { SlideshowConfig, DEFAULT_CONFIG } from "./types";
import fs from "fs";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "data", "slides.json");

function ensureDataDir() {
  const dir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function readConfig(): SlideshowConfig {
  try {
    ensureDataDir();
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, "utf-8");
      return JSON.parse(raw) as SlideshowConfig;
    }
    // Write defaults if file doesn't exist
    writeConfig(DEFAULT_CONFIG);
    return DEFAULT_CONFIG;
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function writeConfig(config: SlideshowConfig): void {
  try {
    ensureDataDir();
    fs.writeFileSync(DATA_FILE, JSON.stringify(config, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to write config:", err);
  }
}
