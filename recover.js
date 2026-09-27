// recover.js：整批恢复，一次扫描每条事务只算一次
import { needResend } from "./plan.js";

function fail(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

export function runRecover(spec) {
  const input = spec || {};
  const participants = input.participants;
  const budget = input.budget;
  if (!Number.isInteger(participants) || participants < 2
      || !Number.isInteger(budget) || budget < 0) {
    throw fail("E_BAD_PARTICIPANT", "participants must be an integer >= 2 and budget a non-negative integer");
  }

  let entries = input.entries;
  if (entries === null || entries === undefined) {
    entries = [];
  }
  if (!Array.isArray(entries)) {
    throw fail("E_BAD_ENTRY", "entries must be an array");
  }

  let resends = 0;
  let pending = 0;
  let rollbacks = 0;
  let remaining = budget;
  const unknown_positions = [];

  for (let i = 0; i < entries.length; i += 1) {
    const entry = entries[i];
    if (entry === null || typeof entry !== "object") {
      throw fail("E_BAD_ENTRY", "entry at position " + (i + 1) + " must be an object");
    }
    const decision = entry.decision;
    if (decision !== "提交" && decision !== "回滚" && decision !== "") {
      throw fail("E_BAD_ENTRY", "decision at position " + (i + 1) + " is invalid");
    }
    // 校验确认名单（越界、重复、非数组），未决事务的名单同样必须合法
    const missing = needResend(participants, entry.acks);

    if (decision === "") {
      // 未落定：回滚全部参与者，登记位置，不花预算
      rollbacks += participants;
      unknown_positions.push(i + 1);
      continue;
    }

    // 已落定：只给没确认的参与者重发，预算用尽后计入待重发
    const send = missing < remaining ? missing : remaining;
    resends += send;
    remaining -= send;
    pending += missing - send;
  }

  return {
    resends,
    pending,
    rollbacks,
    unknown_positions,
    exhausted: pending > 0
  };
}
