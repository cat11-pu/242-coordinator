import fs from "node:fs";
import { needResend } from "./plan.js";
import { runRecover } from "./recover.js";
import { render } from "./app.js";

// 验收断言：上面每条值收进 emit，最后与期望值逐项比对，不符就非零退出。
const __lines = [];
function emit(label, value) { __lines.push([String(label).replace(/ =$/, ""), value]); }


const spec = JSON.parse(fs.readFileSync(process.argv[2] || "sample/entries.json", "utf8"));
const view = render(spec);

emit("重发条数 =", view.resends);
emit("待重发条数 =", view.pending);
emit("回滚条数 =", view.rollbacks);
emit("未决事务位置列表 =", JSON.stringify(view.unknown_positions));
emit("超支 =", view.exhausted);
emit("事务条数 =", view.count);
emit("覆盖复核 =", view.covered);
emit("待重发样例 =", view.tail);


// ---- 异常路径探针：真调用实现，看它报出什么码（不是从样例里抄）----
try {
  runRecover({ participants: 1, budget: 1, entries: [] });
  emit("参与者写错的错误码", "没有报错");
} catch (error) {
  emit("参与者写错的错误码", error && error.code ? error.code : String(error.message));
}
try {
  runRecover({ participants: 3, budget: 1, entries: [{ decision: "搁置", acks: [] }] });
  emit("决定写错的错误码", "没有报错");
} catch (error) {
  emit("决定写错的错误码", error && error.code ? error.code : String(error.message));
}


// ---- 期望值（参考模型算出，与题面给的验收数值一致）----
const EXPECTED = {
  "重发条数": 1,
  "待重发条数": 1,
  "回滚条数": 3,
  "未决事务位置列表": [
    2
  ],
  "超支": true,
  "事务条数": 3,
  "覆盖复核": true,
  "待重发样例": 2,
  "参与者写错的错误码": "E_BAD_PARTICIPANT",
  "决定写错的错误码": "E_BAD_ENTRY"
};
// 有的值在收进来之前已经 stringify 过，比较前先试着解析回来，避免类型错配把正确实现判成不过。
function __same(got, want) {
  if (typeof got === "string") {
    try { const parsed = JSON.parse(got); if (JSON.stringify(parsed) === JSON.stringify(want)) return true; } catch (error) { /* 不是 JSON 就按原文比 */ }
  }
  return JSON.stringify(got) === JSON.stringify(want);
}
let __bad = 0;
for (const [label, want] of Object.entries(EXPECTED)) {
  const found = __lines.find((pair) => pair[0] === label);
  if (!found) { __bad += 1; console.log("缺失验收项 " + label); continue; }
  const got = found[1];
  if (__same(got, want)) { console.log("一致 " + label + " = " + JSON.stringify(got)); }
  else { __bad += 1; console.log("不一致 " + label + " 期望 " + JSON.stringify(want) + " 实际 " + JSON.stringify(got)); }
}
console.log("验收项 " + (Object.keys(EXPECTED).length - __bad) + "/" + Object.keys(EXPECTED).length + " 通过");
process.exit(__bad === 0 ? 0 : 1);
