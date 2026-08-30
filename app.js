const STORAGE_KEY = "yike-menu-state-v1";

const defaults = {
  tab: "home",
  menuMode: "cooked",
  selectedDish: 0,
  dishes: [
    { name: "葱香排骨", category: "荤菜", cooked: true, colors: ["#895033", "#d39142"] },
    { name: "干煸豆角", category: "素菜", cooked: true, colors: ["#4f713b", "#8f9b38"] },
    { name: "番茄炒蛋", category: "素菜", cooked: true, colors: ["#c8482d", "#e9b83c"] },
    { name: "辣炒豆腐", category: "素菜", cooked: false, colors: ["#cf5d37", "#e7b45d"] },
    { name: "菌菇汤", category: "汤羹", cooked: false, colors: ["#7e5a39", "#d0a76a"] }
  ],
  stock: [
    { name: "豆角", added: "今天加入", days: 1 },
    { name: "牛奶", added: "昨天加入", days: 9 },
    { name: "鸡蛋", added: "3 天前加入", days: 12 }
  ],
  tomorrow: "辣炒豆腐",
  cookedCount: 9
};

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    return saved ? { ...defaults, ...saved } : structuredClone(defaults);
  } catch {
    return structuredClone(defaults);
  }
}

let state = loadState();
const app = document.querySelector("#appContent");
const sheet = document.querySelector("#bottomSheet");
const sheetBody = document.querySelector("#sheetBody");
const backdrop = document.querySelector("#sheetBackdrop");
const toast = document.querySelector("#toast");

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function escapeHtml(value) {
  const entities = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  return String(value ?? "").replace(/[&<>"']/g, character => entities[character]);
}

function safeColor(value, fallback) {
  return /^#[0-9a-f]{6}$/i.test(String(value)) ? value : fallback;
}

function plate(dish, extraClass = "") {
  const [first = "#b64f2e", second = "#e0a63c"] = dish.colors || [];
  const food1 = safeColor(first, "#b64f2e");
  const food2 = safeColor(second, "#e0a63c");
  return `<span class="plate ${extraClass}" style="--food1:${food1};--food2:${food2}" aria-hidden="true"></span>`;
}

function bookDoodle() {
  return `
    <svg viewBox="0 0 300 230" role="img" aria-label="手绘菜单册">
      <path class="sketch" d="M61 25q-9 9-5 21v145q4 13 15 9l170-9V32L67 25Z"/>
      <path class="sketch" d="M55 46H43m12 21H41m14 21H43m12 21H41m14 21H43m12 21H41m14 21H43"/>
      <text class="sketch-text" x="91" y="74" font-size="17">YIKE</text>
      <text class="sketch-text" x="78" y="113" font-size="39">MENU</text>
      <path class="sketch" d="M101 137q-22 4-24 23t27 20q21-3 16-22m-20-9v11m-8-5 4 9m13-11-3 9m52-24q23-5 34 8t-2 35m-28-31q19-1 21 15m-21-15-7 28m29-11 12 12"/>
      <circle class="sketch-fill" cx="111" cy="202" r="4"/><circle class="sketch-fill" cx="145" cy="202" r="4"/><circle class="sketch-fill" cx="179" cy="202" r="4"/>
      <path class="sketch" d="m38 202 4 8 8 3-8 3-4 8-3-8-8-3 8-3 3-8Zm220-33 3 6 6 3-6 3-3 6-3-6-6-3 6-3 3-6Z"/>
    </svg>`;
}

function fridgeDoodle() {
  return `
    <svg viewBox="0 0 250 220" role="img" aria-label="手绘冰箱和等待补货的小团子">
      <path class="sketch" d="M124 34h79l8 15v129l-12 10h-75V34Zm0 73h86M139 55v28m0 45v24"/>
      <path class="sketch" d="M46 111q13-20 37-8 28-10 39 13 14 25-8 44-18 16-43 3-22 3-30-17-7-18 5-35Z"/>
      <circle class="sketch-fill" cx="74" cy="132" r="2.5"/><circle class="sketch-fill" cx="93" cy="132" r="2.5"/>
      <path class="sketch" d="M74 146q9 7 19 0m-17-47-6-14m19 15 4-16m16 25 12-10"/>
      <path class="sketch" d="M39 77q36-24 69 0"/>
      <text class="sketch-text" x="49" y="68" font-size="14">快点补货呢</text>
    </svg>`;
}

function renderHome() {
  const today = state.dishes.filter(d => d.cooked).slice(0, 3);
  const tomorrow = state.dishes.find(d => d.name === state.tomorrow) || state.dishes[0];
  return `
    <section class="page" aria-labelledby="homeTitle">
      <p class="eyebrow">黄大厨专属菜谱</p>
      <h1 class="sr-only" id="homeTitle">今日食谱</h1>
      <div class="hero-doodle">${bookDoodle()}</div>
      <div class="segmented" role="group" aria-label="菜单类型">
        <button class="pill ${state.menuMode === "wanted" ? "is-active" : ""}" data-action="mode" data-value="wanted">✦ 我想吃的</button>
        <button class="pill ${state.menuMode === "cooked" ? "is-active" : ""}" data-action="mode" data-value="cooked">♧ 我烧过的</button>
      </div>
      <h2 class="section-title">今日食谱</h2>
      <div class="meal-scroll">
        ${today.map((dish, index) => `<button class="dish-card" data-action="dish" data-index="${index}">${plate(dish)}<span class="dish-name">${escapeHtml(dish.name)}</span></button>`).join("")}
      </div>
      <h2 class="section-title">明日食谱</h2>
      <article class="tomorrow-card">
        ${plate(tomorrow)}
        <div class="tomorrow-actions">
          <strong>${escapeHtml(tomorrow.name)}</strong>
          <button class="soft-button" data-action="random">帮我想道菜</button>
        </div>
      </article>
    </section>`;
}

function renderFridge() {
  return `
    <section class="page" aria-labelledby="fridgeTitle">
      <p class="eyebrow">冰箱</p>
      <h1 class="page-title" id="fridgeTitle">你好像又忘了什么…</h1>
      <div class="fridge-illustration">${fridgeDoodle()}</div>
      <button class="primary-button block-button" data-action="restock">补货</button>
      <h2 class="section-title">还能吃的菜</h2>
      <div class="stock-list">
        ${state.stock.map((item, index) => `
          <button class="stock-item" data-action="stock" data-index="${index}" style="border-left:0;border-right:0;border-top:0;background:transparent;text-align:left;width:100%">
            <span><span class="stock-name">${escapeHtml(item.name)}</span><span class="stock-meta">${escapeHtml(item.added)}</span></span>
            <span class="stock-days ${item.days > 3 ? "ok" : ""}">${item.days}<i class="dot"></i></span>
          </button>`).join("")}
      </div>
    </section>`;
}

function renderMenu() {
  const visible = state.dishes.filter(d => state.menuMode === "cooked" ? d.cooked : !d.cooked);
  const selected = visible[Math.min(state.selectedDish, Math.max(visible.length - 1, 0))] || state.dishes[0];
  return `
    <section class="page" aria-labelledby="menuTitle">
      <div class="top-row">
        <div><p class="eyebrow">${state.menuMode === "cooked" ? "已有菜单" : "心愿菜单"}</p><h1 class="page-title" id="menuTitle">${state.menuMode === "cooked" ? "这就是…我的实力吗！" : "食神啊…赋予我力量吧！"}</h1></div>
        <button class="header-action" data-action="toggle-menu"><span class="spark">✦</span>${state.menuMode === "cooked" ? "想吃的菜" : "烧过的菜"}</button>
      </div>
      <div class="menu-stage">
        <div class="menu-list">
          ${visible.map((dish, index) => `<button class="menu-item ${index === state.selectedDish ? "is-selected" : ""}" data-action="select-menu" data-index="${index}">${escapeHtml(dish.name)}</button>`).join("") || `<p>这里还空空的，新增一道吧。</p>`}
        </div>
        <div class="platter" aria-hidden="true">${plate(selected, "p1")}${plate(state.dishes[(state.dishes.indexOf(selected)+1)%state.dishes.length], "p2")}</div>
      </div>
      <div class="menu-actions">
        <button class="soft-button" data-action="add-dish">＋ 新增</button>
        <button class="primary-button" data-action="arrange">安排！</button>
        <button class="soft-button" data-action="edit-dish">编辑</button>
        <button class="soft-button danger-button" data-action="remove-dish">移出</button>
      </div>
    </section>`;
}

function renderProfile() {
  const cooked = state.dishes.filter(d => d.cooked);
  const favorite = cooked[0] || state.dishes[0];
  return `
    <section class="page" aria-labelledby="profileTitle">
      <div class="top-row"><div><p class="eyebrow">我的厨房</p><h1 class="page-title" id="profileTitle">本周回顾</h1></div><button class="header-action" data-action="about">ⓘ<br>统计说明</button></div>
      <article class="report-card">
        <h2>本周大吃货总结！</h2>
        <h3>最喜欢吃什么？</h3>
        <div class="report-feature">${plate(favorite)}<div><strong class="report-number">4</strong><span>次出现</span></div></div>
        <p class="report-copy">「${escapeHtml(favorite.name)}」本周出现了 4 次，看来你的胃，早就替你投完票了。</p>
        <h3>这周也在好好吃饭吗？</h3>
        <p class="report-copy">本周记录 ${state.cookedCount} 次，吃过 ${cooked.length} 道不同的菜。</p>
        <div class="stat-grid">
          <div class="stat"><strong>${state.cookedCount}</strong><span>本周记录</span></div>
          <div class="stat"><strong>${state.stock.length}</strong><span>冰箱存货</span></div>
          <div class="stat"><strong>${state.dishes.length}</strong><span>菜单总数</span></div>
        </div>
      </article>
    </section>`;
}

function render() {
  const pages = { home: renderHome, fridge: renderFridge, menu: renderMenu, profile: renderProfile };
  app.innerHTML = pages[state.tab]();
  document.querySelectorAll(".tab-button").forEach(button => {
    const active = button.dataset.tab === state.tab;
    button.classList.toggle("is-active", active);
    active ? button.setAttribute("aria-current", "page") : button.removeAttribute("aria-current");
  });
  saveState();
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("is-visible");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("is-visible"), 1800);
}

function openSheet(markup) {
  sheetBody.innerHTML = markup;
  sheet.hidden = false;
  backdrop.hidden = false;
  document.body.style.overflow = "hidden";
  requestAnimationFrame(() => sheet.querySelector("input, textarea, button:not(.sheet-close)")?.focus());
}

function closeSheet() {
  sheet.hidden = true;
  backdrop.hidden = true;
  document.body.style.overflow = "";
}

function dishForm(dish = {}) {
  const safeName = escapeHtml(dish.name || "");
  return `
    <h2 class="sheet-title" id="sheetTitle">${dish.name ? "编辑菜品" : "新增菜品"}</h2>
    <p class="sheet-subtitle">让这道菜变得更完整吧！</p>
    <form id="dishForm">
      <input type="hidden" name="originalName" value="${safeName}">
      <div class="field"><label for="dishName">菜的名字 *</label><input id="dishName" name="dishName" value="${safeName}" maxlength="12" required placeholder="例如：小炒肉"></div>
      <div class="field"><label>分类 *</label><div class="chip-row">${["荤菜","素菜","汤羹","小吃","主食"].map((name, i) => `<button type="button" class="chip ${(dish.category === name || (!dish.category && i === 0)) ? "is-selected" : ""}" data-category="${name}">${name}</button>`).join("")}</div><input type="hidden" name="category" value="${dish.category || "荤菜"}"></div>
      <div class="field"><label>放进哪里</label><div class="chip-row"><button type="button" class="chip is-selected" data-cooked="true">我烧过的</button><button type="button" class="chip" data-cooked="false">我想吃的</button></div><input type="hidden" name="cooked" value="${dish.cooked === false ? "false" : "true"}"></div>
      <div class="field"><label for="note">备注</label><textarea id="note" rows="3" placeholder="口味、做法或想和谁一起吃…"></textarea></div>
      <button class="primary-button block-button" type="submit">保存</button>
    </form>`;
}

function stockForm() {
  return `
    <h2 class="sheet-title" id="sheetTitle">给冰箱补货</h2>
    <p class="sheet-subtitle">记下来，就不会在角落里默默过期。</p>
    <form id="stockForm">
      <div class="field"><label for="stockName">食材名称 *</label><input id="stockName" name="stockName" required maxlength="10" placeholder="例如：西兰花"></div>
      <div class="field"><label for="stockDays">保鲜天数</label><input id="stockDays" name="stockDays" type="number" min="1" max="30" value="5"></div>
      <button class="primary-button block-button" type="submit">放进冰箱</button>
    </form>`;
}

document.querySelector(".tab-bar").addEventListener("click", event => {
  const button = event.target.closest(".tab-button");
  if (!button) return;
  state.tab = button.dataset.tab;
  state.selectedDish = 0;
  render();
  app.focus({ preventScroll: true });
});

app.addEventListener("click", event => {
  const target = event.target.closest("[data-action]");
  if (!target) return;
  const action = target.dataset.action;
  if (action === "mode") { state.menuMode = target.dataset.value; render(); }
  if (action === "random") {
    const choices = state.dishes.filter(d => !d.cooked);
    const pool = choices.length ? choices : state.dishes;
    const current = pool.findIndex(d => d.name === state.tomorrow);
    state.tomorrow = pool[(current + 1) % pool.length].name;
    render();
    showToast(`明天就吃「${state.tomorrow}」吧`);
  }
  if (action === "toggle-menu") { state.menuMode = state.menuMode === "cooked" ? "wanted" : "cooked"; state.selectedDish = 0; render(); }
  if (action === "select-menu") { state.selectedDish = Number(target.dataset.index); render(); }
  if (action === "restock") openSheet(stockForm());
  if (action === "add-dish") openSheet(dishForm());
  if (action === "edit-dish") {
    const list = state.dishes.filter(d => state.menuMode === "cooked" ? d.cooked : !d.cooked);
    if (!list.length) return showToast("先新增一道菜吧");
    openSheet(dishForm(list[state.selectedDish] || list[0]));
  }
  if (action === "arrange") {
    const list = state.dishes.filter(d => state.menuMode === "cooked" ? d.cooked : !d.cooked);
    const chosen = list[state.selectedDish] || list[0];
    if (!chosen) return showToast("菜单还是空的");
    state.tomorrow = chosen.name; state.tab = "home"; render(); showToast(`已为明天安排「${chosen.name}」`);
  }
  if (action === "remove-dish") {
    const list = state.dishes.filter(d => state.menuMode === "cooked" ? d.cooked : !d.cooked);
    const chosen = list[state.selectedDish] || list[0];
    if (!chosen) return showToast("没有可移出的菜");
    chosen.cooked = !chosen.cooked; state.selectedDish = 0; render(); showToast(`已移到「${chosen.cooked ? "我烧过的" : "我想吃的"}」`);
  }
  if (action === "stock") {
    const item = state.stock[Number(target.dataset.index)];
    showToast(`${item.name}还有 ${item.days} 天，记得安排上`);
  }
  if (action === "dish") showToast("长按记忆不如今晚再做一次");
  if (action === "about") openSheet(`<h2 class="sheet-title" id="sheetTitle">统计说明</h2><p class="report-copy">每次把菜安排进今日食谱，就会计入本周记录。所有数据只保存在当前浏览器中。</p><button class="soft-button block-button" data-reset="true">重置体验数据</button>`);
});

sheet.addEventListener("click", event => {
  const category = event.target.closest("[data-category]");
  if (category) {
    category.parentElement.querySelectorAll(".chip").forEach(chip => chip.classList.toggle("is-selected", chip === category));
    category.closest(".field").querySelector('input[name="category"]').value = category.dataset.category;
  }
  const cooked = event.target.closest("[data-cooked]");
  if (cooked) {
    cooked.parentElement.querySelectorAll(".chip").forEach(chip => chip.classList.toggle("is-selected", chip === cooked));
    cooked.closest(".field").querySelector('input[name="cooked"]').value = cooked.dataset.cooked;
  }
  if (event.target.closest("[data-reset]")) {
    state = structuredClone(defaults); closeSheet(); render(); showToast("体验数据已重置");
  }
});

sheet.addEventListener("submit", event => {
  event.preventDefault();
  const data = new FormData(event.target);
  if (event.target.id === "dishForm") {
    const dishName = String(data.get("dishName") || "").trim();
    if (!dishName) {
      const input = event.target.elements.dishName;
      input.setCustomValidity("请输入菜名");
      input.reportValidity();
      input.addEventListener("input", () => input.setCustomValidity(""), { once: true });
      return;
    }
    const original = data.get("originalName");
    const existing = state.dishes.find(d => d.name === original);
    const colors = existing?.colors || ["#af4930", "#ddb04a"];
    const next = { name: dishName, category: data.get("category"), cooked: data.get("cooked") === "true", colors };
    existing ? Object.assign(existing, next) : state.dishes.push(next);
    closeSheet(); render(); showToast(existing ? "菜品已更新" : "新菜加入菜单啦");
  }
  if (event.target.id === "stockForm") {
    const stockName = String(data.get("stockName") || "").trim();
    if (!stockName) {
      const input = event.target.elements.stockName;
      input.setCustomValidity("请输入食材名称");
      input.reportValidity();
      input.addEventListener("input", () => input.setCustomValidity(""), { once: true });
      return;
    }
    state.stock.unshift({ name: stockName, added: "今天加入", days: Number(data.get("stockDays")) || 5 });
    closeSheet(); render(); showToast("已经放进冰箱了");
  }
});

document.querySelector("#sheetClose").addEventListener("click", closeSheet);
backdrop.addEventListener("click", closeSheet);
document.addEventListener("keydown", event => { if (event.key === "Escape" && !sheet.hidden) closeSheet(); });

render();
