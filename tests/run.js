import assert from "node:assert";
import { needResend } from "../plan.js";
import { runRecover } from "../recover.js";
import { render } from "../app.js";

let failed = 0;
function check(name, fn) {
  try { fn(); console.log("ok " + name); } catch (e) { failed += 1; console.log("FAIL " + name + " :: " + e.message); }
}

check("needResend returns a number", () => {
  assert.strictEqual(typeof needResend(3, [1]), "number");
});

check("runRecover returns resends", () => {
  assert.strictEqual(typeof runRecover({ participants: 2, budget: 1, entries: [] }).resends, "number");
});

check("runRecover returns unknown positions", () => {
  assert.ok(Array.isArray(runRecover({ participants: 2, budget: 1, entries: [] }).unknown_positions));
});

check("render counts entries", () => {
  assert.strictEqual(typeof render({ participants: 2, budget: 1, entries: [] }).count, "number");
});

check("render exposes exhausted flag", () => {
  assert.strictEqual(typeof render({ participants: 2, budget: 1, entries: [] }).exhausted, "boolean");
});

console.log("5 cases, " + failed + " failed");
process.exit(failed === 0 ? 0 : 1);
