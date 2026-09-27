// plan.js：一条事务要重发几条（基线：一律给零）
export function needResend(participants, acks) {
  return 0;
}
