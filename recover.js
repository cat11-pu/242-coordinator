// recover.js：整批恢复（一次扫描，每条事务只算一次）
import { needResend } from "./plan.js";

const DECISIONS = ["提交", "回滚", ""];

function fail(code, message) {
  const error = new Error(message);
  error.code = code;
  throw error;
}

function isInteger(value) {
  return typeof value === "number" && Number.isInteger(value);
}

export function runRecover(spec) {
  const source = spec || {};
  const { participants, budget } = source;

  if (!isInteger(participants) || participants < 2) {
    fail("E_BAD_PARTICIPANT", "participants must be an integer not less than 2");
  }
  if (!isInteger(budget) || budget < 0) {
    fail("E_BAD_PARTICIPANT", "budget must be a non-negative integer");
  }

  const entries = source.entries;
  if (!Array.isArray(entries)) {
    fail("E_BAD_ENTRY", "entries must be an array");
  }

  let resends = 0;
  let pending = 0;
  let rollbacks = 0;
  let remaining = budget;
  const unknown_positions = [];

  for (let index = 0; index < entries.length; index += 1) {
    const position = index + 1;
    const entry = entries[index];

    if (!entry || typeof entry !== "object" || DECISIONS.indexOf(entry.decision) === -1) {
      fail("E_BAD_ENTRY", "bad decision at entry " + position);
    }
    const acks = entry.acks;
    if (!Array.isArray(acks)) {
      fail("E_BAD_ENTRY", "acks must be an array at entry " + position);
    }
    const seen = new Set();
    for (const ack of acks) {
      if (!isInteger(ack) || ack < 1 || ack > participants || seen.has(ack)) {
        fail("E_BAD_ENTRY", "acks out of range or duplicated at entry " + position);
      }
      seen.add(ack);
    }

    if (entry.decision === "") {
      // 未落定：回滚全部参与者，登记位置，不花预算
      rollbacks += participants;
      unknown_positions.push(position);
    } else {
      // 落定：只给没确认的参与者重发，预算用尽后计入待重发
      let missing = needResend(participants, acks);
      if (remaining > 0 && missing > 0) {
        const sent = Math.min(missing, remaining);
        resends += sent;
        remaining -= sent;
        missing -= sent;
      }
      pending += missing;
    }
  }

  return { resends, pending, rollbacks, unknown_positions, exhausted: pending > 0 };
}
