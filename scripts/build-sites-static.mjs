import { cpSync, copyFileSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";

const output = "dist";
const app = ".next/server/app";
const routes = ["index", "notices", "coaches", "status", "contact", "games/valorant", "games/overwatch-2"];

const overwatch = readFileSync(join(app, "games/overwatch-2.html"), "utf8");
if (!overwatch.includes("상담 연결 설정 후 가능합니다")) {
  throw new Error("Build the public preview without Supabase configuration before exporting.");
}

mkdirSync(output, { recursive: true });
cpSync("public", output, { recursive: true });
cpSync(".next/static", join(output, "_next/static"), { recursive: true });
copyFileSync(join(app, "_not-found.html"), join(output, "404.html"));

for (const route of routes) {
  const destination = join(output, route);
  mkdirSync(dirname(destination), { recursive: true });
  copyFileSync(join(app, route + ".html"), destination + ".html");
}

