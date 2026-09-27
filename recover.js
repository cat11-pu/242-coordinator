// recover.js：整批恢复（基线：一律给零）
import { needResend } from "./plan.js";

export function runRecover(spec) {
  return { resends: 0, pending: 0, rollbacks: 0, unknown_positions: [], exhausted: false };
}
