// plan.js：一条事务还缺几个确认（参与者总数减已确认人数）
export function needResend(participants, acks) {
  if (!Number.isInteger(participants) || participants < 2) {
    const error = new Error("participants must be an integer not smaller than 2");
    error.code = "E_BAD_PARTICIPANT";
    throw error;
  }
  if (!Array.isArray(acks)) {
    const error = new Error("acks must be an array");
    error.code = "E_BAD_ENTRY";
    throw error;
  }
  const confirmed = new Set();
  for (const ack of acks) {
    if (!Number.isInteger(ack) || ack < 1 || ack > participants) {
      const error = new Error("ack id out of range");
      error.code = "E_BAD_ENTRY";
      throw error;
    }
    if (confirmed.has(ack)) {
      const error = new Error("duplicate ack id");
      error.code = "E_BAD_ENTRY";
      throw error;
    }
    confirmed.add(ack);
  }
  return participants - confirmed.size;
}
