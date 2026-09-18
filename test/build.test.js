const test = require("node:test");
const assert = require("node:assert");
const { execFileSync } = require("child_process");
const path = require("path");

test("public/ matches the sources in src/ (run: node build.js)", () => {
  execFileSync(process.execPath, [path.join(__dirname, "..", "build.js"), "--check"], { stdio: "pipe" });
  assert.ok(true);
});
