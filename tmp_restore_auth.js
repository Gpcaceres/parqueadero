const fs = require("fs");
const path = require("path");
const from = path.join(
  __dirname,
  "personas",
  "src",
  "auth",
  "auth.service.new.ts",
);
const to = path.join(__dirname, "personas", "src", "auth", "auth.service.ts");
const content = fs.readFileSync(from, "utf8");
fs.writeFileSync(to, content, "utf8");
console.log("restored", to);
