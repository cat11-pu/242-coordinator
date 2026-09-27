// app.js：渲染结果
import { needResend } from "./plan.js";
import { runRecover } from "./recover.js";

export function render(spec) {
  const entries = spec.entries || [];
  const count = spec.participants || 0;
  const view = runRecover(spec);
  const unknown = view.unknown_positions || [];
  const settled = entries.filter(function (entry) { return (entry.decision || "") !== ""; });
  const needed = settled.reduce(function (sum, entry) { return sum + needResend(count, entry.acks || []); }, 0);
  return { resends: view.resends || 0, pending: view.pending || 0, rollbacks: view.rollbacks || 0,
           unknown_positions: unknown, exhausted: !!view.exhausted, count: entries.length,
           covered: (view.resends || 0) + (view.pending || 0) === needed,
           tail: needResend(3, [1]) };
}
