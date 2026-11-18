// Tiny zero-dependency static server for the built prototype (_site).
// Same behaviour as docker/nginx.conf / vercel.json: clean URLs, redirects, 404 page.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(process.argv[2] || "_site");
const PORT = Number(process.env.PORT || 80);
const REDIRECTS = { "/home": "/", "/jobs": "/", "/career-hub": "/", "/ats": "/login", "/terms-and-conditions": "/terms-of-service" };
const TYPES = {
  ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "application/javascript", ".json": "application/json",
  ".webmanifest": "application/manifest+json", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg", ".gif": "image/gif", ".webp": "image/webp", ".ico": "image/x-icon", ".otf": "font/otf",
  ".woff": "font/woff", ".woff2": "font/woff2", ".pdf": "application/pdf", ".txt": "text/plain",
};

const isFile = (p) => { try { return fs.statSync(p).isFile(); } catch { return false; } };

function send(res, status, file) {
  const ext = path.extname(file).toLowerCase();
  const headers = { "Content-Type": TYPES[ext] || "application/octet-stream" };
  if (ext !== ".html") headers["Cache-Control"] = "public, max-age=604800";
  res.writeHead(status, headers);
  fs.createReadStream(file).pipe(res);
}

http.createServer((req, res) => {
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url, "http://x").pathname); } catch { pathname = "/"; }
  const query = req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "";

  if (REDIRECTS[pathname]) { res.writeHead(302, { Location: REDIRECTS[pathname] }); return res.end(); }
  if (pathname.length > 1 && pathname.endsWith("/")) {           // /about-us/ -> /about-us
    res.writeHead(301, { Location: pathname.replace(/\/+$/, "") + query }); return res.end();
  }

  const base = path.join(ROOT, path.normalize(pathname));
  if (!base.startsWith(ROOT)) { res.writeHead(400); return res.end(); }
  for (const f of [base, path.join(base, "index.html"), base + ".html"]) {
    if (isFile(f)) return send(res, 200, f);
  }
  send(res, 404, path.join(ROOT, "404.html"));
}).listen(PORT, () => console.log(`Job Labs prototype on http://localhost:${PORT} (serving ${ROOT})`));
