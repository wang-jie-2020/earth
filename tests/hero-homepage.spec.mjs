import { existsSync, readFileSync } from "node:fs";
import assert from "node:assert/strict";

const heroPath = new URL("../examples/hero-homepage.html", import.meta.url);
assert.ok(
  existsSync(heroPath),
  `Expected hero homepage file to exist: ${heroPath}`,
);
const html = readFileSync(heroPath, "utf8");

assert.match(html, /const\s+METRICS\s*=\s*\{/, "METRICS constant must exist");
assert.match(html, /id=['"]metric-total['"]/, "metric-total card id must exist");
assert.match(html, /id=['"]metric-regions['"]/, "metric-regions card id must exist");
assert.match(html, /id=['"]metric-active['"]/, "metric-active card id must exist");
assert.match(html, /id=['"]metric-risk['"]/, "metric-risk card id must exist");
assert.match(html, /function\s+updateTooltipPosition\s*\(/, "tooltip follow function must exist");
assert.match(html, /function\s+openProjectDetail\s*\(/, "detail open function must exist");
assert.doesNotMatch(
  html,
  /function\s+fillMetrics\s*\([^)]*\)\s*\{[\s\S]*?\bPROJECTS\.filter\b[\s\S]*?\}/,
  "top metrics must not be derived from PROJECTS in fillMetrics",
);
assert.doesNotMatch(
  html,
  /\bPROJECTS\.[\s\S]{0,300}(?:getElementById|querySelector)\s*\(\s*['"](?:#)?metric-(?:total|regions|active|risk)['"]\s*\)|(?:getElementById|querySelector)\s*\(\s*['"](?:#)?metric-(?:total|regions|active|risk)['"]\s*\)[\s\S]{0,300}\bPROJECTS\./,
  "metric card assignment contexts must not directly reference PROJECTS",
);

console.log("hero-homepage smoke test passed");
