// ui.js：操作面板与视图（原生 DOM，无弹窗）
import { render } from "./app.js";

export function mount(spec, parts) {
  parts.log.textContent = "参与者 " + (spec.participants || 0) + " 个，重发预算 " + (spec.budget || 0)
    + "，事务 " + (spec.entries || []).length + " 条。";

  function draw() {
    let view = null;
    try {
      view = render(spec);
    } catch (error) {
      parts.out.textContent = String(error && error.code ? error.code : error);
      parts.log.textContent = "跑不动：" + String(error && error.message ? error.message : error);
      return;
    }
    parts.out.textContent = JSON.stringify(view, null, 1);
    parts.stage.textContent = "";
    (spec.entries || []).forEach(function (entry, spot) {
      const row = document.createElement("div");
      row.className = "row";
      const head = document.createElement("span");
      head.textContent = "第 " + (spot + 1) + " 条 决定 " + (entry.decision || "未决")
        + " 已确认 " + (entry.acks || []).length + " 个";
      row.appendChild(head);
      const mark = document.createElement("span");
      const unknown = (view.unknown_positions || []).indexOf(spot + 1) !== -1;
      mark.className = "chip" + (unknown ? " bad" : " ok");
      mark.textContent = unknown ? "未决回滚全部" : "重发决定";
      row.appendChild(mark);
      parts.stage.appendChild(row);
    });
    parts.legend.textContent = "重发 " + view.resends + " 条，待重发 " + view.pending + " 条，回滚 "
      + view.rollbacks + " 条";
    parts.log.textContent = view.exhausted ? "预算用尽，还有待重发" : "预算够用";
  }

  const budgetInput = document.createElement("input");
  budgetInput.type = "number";
  budgetInput.value = "3";
  parts.controls.appendChild(budgetInput);

  const runButton = document.createElement("button");
  runButton.className = "primary";
  runButton.textContent = "恢复一遍";
  runButton.addEventListener("click", draw);
  parts.controls.appendChild(runButton);

  const addButton = document.createElement("button");
  addButton.textContent = "追加一条未决事务";
  addButton.addEventListener("click", function () {
    spec.entries = (spec.entries || []).concat([{ decision: "", acks: [] }]);
    draw();
  });
  parts.controls.appendChild(addButton);

  const dropButton = document.createElement("button");
  dropButton.textContent = "删最后一条事务";
  dropButton.addEventListener("click", function () {
    spec.entries = (spec.entries || []).slice(0, Math.max(0, (spec.entries || []).length - 1));
    draw();
  });
  parts.controls.appendChild(dropButton);

  const budgetButton = document.createElement("button");
  budgetButton.textContent = "预算加一";
  budgetButton.addEventListener("click", function () {
    spec.budget = (spec.budget || 0) + 1;
    draw();
  });
  parts.controls.appendChild(budgetButton);

  draw();
}
