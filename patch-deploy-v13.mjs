import fs from "node:fs";

const serverPath = "./server/index.js";
const packagePath = "./package.json";

let server = fs.readFileSync(serverPath, "utf8");
let pkg = JSON.parse(fs.readFileSync(packagePath, "utf8"));

if (!server.includes('import path from "node:path";')) {
  server = server.replace(
    'import express from "express";',
    'import express from "express";\nimport path from "node:path";\nimport { fileURLToPath } from "node:url";'
  );
}

if (!server.includes("const __filename = fileURLToPath(import.meta.url);")) {
  const marker = "const app = express();";
  server = server.replace(
    marker,
    `const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

${marker}`
  );
}

if (!server.includes("EDUBRAIN_PRODUCTION_STATIC_V13")) {
  const staticBlock = `

// EDUBRAIN_PRODUCTION_STATIC_V13
const distPath = path.join(__dirname, "../dist");

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));

  app.use((req, res, next) => {
    if (req.method === "GET" && !req.path.startsWith("/api")) {
      return res.sendFile(path.join(distPath, "index.html"));
    }

    return next();
  });
}

`;

  const listenIndex = server.lastIndexOf("app.listen");

  if (listenIndex < 0) {
    throw new Error("app.listen tidak ditemukan di server/index.js");
  }

  server = server.slice(0, listenIndex) + staticBlock + server.slice(listenIndex);
}

pkg.scripts = pkg.scripts || {};
pkg.scripts.build = "vite build";
pkg.scripts.start = "node server/index.js";

pkg.engines = pkg.engines || {};
pkg.engines.node = ">=20";

fs.writeFileSync(serverPath, server, "utf8");
fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2), "utf8");

console.log("Patch deploy V13 selesai.");
