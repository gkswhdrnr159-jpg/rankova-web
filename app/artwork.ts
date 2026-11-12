import { existsSync } from "node:fs";
import { join } from "node:path";

export function availableArtwork(filename: string) {
  const relativePath = join("images", filename);
  return existsSync(join(process.cwd(), "public", relativePath))
    ? `/images/${filename}`
    : null;
}

