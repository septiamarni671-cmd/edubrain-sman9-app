import fs from "node:fs";

const appPath = "./src/App.jsx";
let app = fs.readFileSync(appPath, "utf8");

// Fix fetch(apiUrl("/api/xxx");  -> fetch(apiUrl("/api/xxx"));
app = app.replace(
  /fetch\(apiUrl\((["'])(\/api\/[^"']+)\1\s*;/g,
  'fetch(apiUrl("$2"));'
);

// Fix fetch(apiUrl("/api/xxx", { ...  -> fetch(apiUrl("/api/xxx"), { ...
app = app.replace(
  /fetch\(apiUrl\((["'])(\/api\/[^"']+)\1\s*,/g,
  'fetch(apiUrl("$2"),'
);

// Fix apiUrl("/api/xxx",  -> apiUrl("/api/xxx"),
app = app.replace(
  /apiUrl\((["'])(\/api\/[^"']+)\1\s*,/g,
  'apiUrl("$2"),'
);

// Bersihkan kalau sempat dobel
app = app.replaceAll("fetch(apiUrl(apiUrl(", "fetch(apiUrl(");
app = app.replaceAll("apiUrl(apiUrl(", "apiUrl(");

fs.writeFileSync(appPath, app, "utf8");

console.log("Fix API URL V13B.1 selesai.");
