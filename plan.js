// plan.js：一条事务还缺几个确认（参与者总数减已确认人数）
export function needResend(participants, acks) {
  const confirmed = Array.isArray(acks) ? acks.length : 0;
  return participants - confirmed;
}
