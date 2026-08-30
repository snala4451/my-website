const STORAGE_KEY = "huang-chef-state-v2";
const LEGACY_STORAGE_KEY = "yike-menu-state-v1";
const CATEGORIES = ["主菜", "主食", "荤菜", "配菜", "素菜", "汤羹", "小吃", "甜品", "饮品", "其他"];
const EXPIRY_PRESETS = [0, 3, 7, 14, 30, 90, 180, 365];
const MAX_IMPORT_BYTES = 8 * 1024 * 1024;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function dateKey(offsetDays = 0) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + offsetDays);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function addDays(day, amount) {
  const date = /^\d{4}-\d{2}-\d{2}$/.test(day) ? new Date(`${day}T12:00:00`) : new Date();
  date.setDate(date.getDate() + amount);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

const defaults = {
  version: 2,
  tab: "home",
  menuMode: "cooked",
  categoryFilter: "全部",
  selectedDish: "dish-ribs",
  profileName: "黄大厨",
  dishes: [
    {
      id: "dish-ribs",
      name: "葱香排骨",
      category: "荤菜",
      cooked: true,
      colors: ["#8f4d34", "#e1a835"],
      note: "葱香浓一点，排骨收汁到发亮。",
      recipeUrl: "",
      tags: ["下饭"],
      ingredients: ["排骨 500g", "小葱 4 根", "生抽 2 汤匙", "冰糖 10g"],
      steps: ["排骨冷水下锅焯水，冲洗干净。", "小火炒化冰糖，放入排骨翻匀。", "加入调味料焖煮，最后撒葱收汁。"],
      image: ""
    },
    {
      id: "dish-beans",
      name: "干煸豆角",
      category: "素菜",
      cooked: true,
      colors: ["#54743e", "#b18d2e"],
      note: "豆角一定要熟透。",
      recipeUrl: "",
      tags: ["快手菜"],
      ingredients: ["豆角 350g", "蒜 3 瓣", "干辣椒 4 个"],
      steps: ["豆角沥干水分后煸至表皮起皱。", "爆香蒜末和干辣椒。", "倒回豆角，加盐翻匀。"],
      image: ""
    },
    {
      id: "dish-tomato-eggs",
      name: "番茄炒蛋",
      category: "主菜",
      cooked: true,
      colors: ["#c94f36", "#f0c53d"],
      note: "酸甜口，留一点汤汁拌饭。",
      recipeUrl: "",
      tags: ["家常"],
      ingredients: ["番茄 2 个", "鸡蛋 3 个", "盐 适量"],
      steps: ["鸡蛋炒至刚凝固后盛出。", "番茄炒软出汁。", "倒回鸡蛋，调味后快速翻匀。"],
      image: ""
    },
    {
      id: "dish-spicy-tofu",
      name: "辣炒豆腐",
      category: "主菜",
      cooked: false,
      colors: ["#c65d40", "#7b439c"],
      note: "下次试试加一点花椒。",
      recipeUrl: "",
      tags: ["想尝试"],
      ingredients: ["嫩豆腐 1 盒", "辣椒 2 个", "蒜 2 瓣"],
      steps: ["豆腐切块，擦干表面水分。", "煎至两面金黄。", "加入辣椒和调味汁翻匀。"],
      image: ""
    },
    {
      id: "dish-mushroom-soup",
      name: "菌菇汤",
      category: "汤羹",
      cooked: false,
      colors: ["#826347", "#d8b16e"],
      note: "适合下雨天。",
      recipeUrl: "",
      tags: ["暖胃"],
      ingredients: ["混合菌菇 300g", "姜 2 片", "白胡椒 少许"],
      steps: ["菌菇洗净切段。", "热锅炒香姜片和菌菇。", "加水煮开，小火煮 12 分钟后调味。"],
      image: ""
    }
  ],
  stock: [
    { id: "stock-beans", name: "豆角", added: dateKey(), expiry: addDays(dateKey(), 1), note: "晚饭先用" },
    { id: "stock-milk", name: "牛奶", added: dateKey(-1), expiry: addDays(dateKey(), 9), note: "早餐" },
    { id: "stock-eggs", name: "鸡蛋", added: dateKey(-3), expiry: addDays(dateKey(), 12), note: "" }
  ],
  plans: {
    today: ["dish-ribs", "dish-beans", "dish-tomato-eggs"],
    tomorrow: ["dish-spicy-tofu"]
  },
  history: [],
  totalCooked: 9,
  settings: { bgm: false, bgmMode: "sunny", language: "system" }
};

function uid(prefix) {
  const suffix = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}-${suffix}`;
}

function escapeHtml(value) {
  const entities = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  return String(value ?? "").replace(/[&<>"']/g, character => entities[character]);
}

function cleanText(value, maxLength = 120) {
  return typeof value === "string" ? value.replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, maxLength) : "";
}

function safeColor(value, fallback) {
  return /^#[0-9a-f]{6}$/i.test(String(value)) ? String(value) : fallback;
}

function safeUrl(value) {
  const text = cleanText(value, 500);
  if (!text) return "";
  try {
    const parsed = new URL(text);
    return ["http:", "https:"].includes(parsed.protocol) ? parsed.href : "";
  } catch {
    return "";
  }
}

function safeImage(value) {
  return typeof value === "string" && value.length <= 900000 && /^data:image\/(?:jpeg|png|webp);base64,[a-z0-9+/=]+$/i.test(value) ? value : "";
}

function normalizeStringList(value, limit = 20) {
  const source = Array.isArray(value) ? value : typeof value === "string" ? value.split(/\r?\n/) : [];
  return source.map(item => cleanText(item, 180)).filter(Boolean).slice(0, limit);
}

function normalizeState(input) {
  const source = input && typeof input === "object" && !Array.isArray(input) ? input : {};
  const sourceDishes = Array.isArray(source.dishes) && source.dishes.length ? source.dishes.slice(0, 60) : defaults.dishes;
  const usedIds = new Set();
  const dishes = sourceDishes.map((raw, index) => {
    const item = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
    let id = /^[a-z0-9-]{1,80}$/i.test(String(item.id || "")) ? String(item.id) : `dish-${index + 1}`;
    if (usedIds.has(id)) id = `dish-${index + 1}-${Date.now()}`;
    usedIds.add(id);
    const colors = Array.isArray(item.colors) ? item.colors : [];
    return {
      id,
      name: cleanText(item.name, 24) || `未命名菜品 ${index + 1}`,
      category: CATEGORIES.includes(item.category) ? item.category : "其他",
      cooked: item.cooked !== false,
      colors: [safeColor(colors[0], "#dba91e"), safeColor(colors[1], "#63358a")],
      note: cleanText(item.note, 240),
      recipeUrl: safeUrl(item.recipeUrl),
      tags: normalizeStringList(item.tags, 8).map(tag => tag.slice(0, 16)),
      ingredients: normalizeStringList(item.ingredients),
      steps: normalizeStringList(item.steps, 16),
      image: safeImage(item.image)
    };
  });
  const dishById = new Map(dishes.map(dish => [dish.id, dish]));
  const dishByName = new Map(dishes.map(dish => [dish.name, dish]));
  const normalizePlan = values => (Array.isArray(values) ? values : values ? [values] : [])
    .map(value => dishById.get(String(value)) || dishByName.get(String(value)))
    .filter(Boolean)
    .map(dish => dish.id)
    .filter((id, index, list) => list.indexOf(id) === index)
    .slice(0, 8);
  const legacyTomorrow = source.tomorrow ? [source.tomorrow] : [];
  const sourcePlans = source.plans && typeof source.plans === "object" ? source.plans : {};
  const normalizedToday = normalizePlan(sourcePlans.today);
  const normalizedTomorrow = normalizePlan(sourcePlans.tomorrow);
  const normalizedLegacyTomorrow = normalizePlan(legacyTomorrow);
  const rawStock = Array.isArray(source.stock) ? source.stock.slice(0, 100) : defaults.stock;
  const usedStockIds = new Set();
  const stock = rawStock.map((raw, index) => {
    const item = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
    const legacyDays = Number.isFinite(Number(item.days)) ? Math.max(0, Math.min(3650, Number(item.days))) : 7;
    let id = /^[a-z0-9-]{1,80}$/i.test(String(item.id || "")) ? String(item.id) : `stock-${index + 1}-${Date.now()}`;
    if (usedStockIds.has(id)) id = `stock-${index + 1}-${Date.now()}`;
    usedStockIds.add(id);
    return {
      id,
      name: cleanText(item.name, 24) || `未命名食材 ${index + 1}`,
      added: /^\d{4}-\d{2}-\d{2}$/.test(String(item.added || "")) ? String(item.added) : dateKey(),
      expiry: /^\d{4}-\d{2}-\d{2}$/.test(String(item.expiry || "")) ? String(item.expiry) : addDays(dateKey(), legacyDays),
      note: cleanText(item.note, 160)
    };
  });
  const history = (Array.isArray(source.history) ? source.history : []).map(raw => {
    const item = raw && typeof raw === "object" ? raw : {};
    return {
      date: /^\d{4}-\d{2}-\d{2}$/.test(String(item.date || "")) ? String(item.date) : dateKey(),
      dishId: dishById.has(String(item.dishId)) ? String(item.dishId) : dishes[0]?.id || ""
    };
  }).filter(item => item.dishId).slice(-400);
  const tabs = ["home", "menu", "fridge", "profile"];
  const selectedDish = dishById.has(String(source.selectedDish)) ? String(source.selectedDish) : dishes[0]?.id || "";
  const settings = source.settings && typeof source.settings === "object" ? source.settings : {};
  return {
    version: 2,
    tab: tabs.includes(source.tab) ? source.tab : "home",
    menuMode: source.menuMode === "wanted" ? "wanted" : "cooked",
    categoryFilter: source.categoryFilter === "全部" || CATEGORIES.includes(source.categoryFilter) ? source.categoryFilter : "全部",
    selectedDish,
    profileName: cleanText(source.profileName, 20) || "黄大厨",
    dishes,
    stock,
    plans: {
      today: Object.hasOwn(sourcePlans, "today") ? normalizedToday : normalizePlan(defaults.plans.today),
      tomorrow: Object.hasOwn(sourcePlans, "tomorrow") ? normalizedTomorrow : Object.hasOwn(source, "tomorrow") ? normalizedLegacyTomorrow : normalizePlan(defaults.plans.tomorrow)
    },
    history,
    totalCooked: Math.max(0, Math.min(99999, Number(source.totalCooked ?? source.cookedCount ?? defaults.totalCooked) || 0)),
    settings: {
      bgm: settings.bgm === true,
      bgmMode: settings.bgmMode === "violet" ? "violet" : "sunny",
      language: settings.language === "zh-CN" ? "zh-CN" : "system"
    }
  };
}

function loadState() {
  for (const key of [STORAGE_KEY, LEGACY_STORAGE_KEY]) {
    try {
      const saved = localStorage.getItem(key);
      if (saved) return normalizeState(JSON.parse(saved));
    } catch {
      try { localStorage.removeItem(key); } catch { /* Storage may be unavailable in private mode. */ }
    }
  }
  return normalizeState(defaults);
}

let state = loadState();
let pendingImage = "";
let recipeOptions = { dishId: "", template: "sun", ratio: "long" };
let bgmContext = null;
let bgmTimer = null;
let bgmStep = 0;

const app = document.querySelector("#appContent");
const sheet = document.querySelector("#bottomSheet");
const sheetBody = document.querySelector("#sheetBody");
const backdrop = document.querySelector("#sheetBackdrop");
const toast = document.querySelector("#toast");

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

function getDish(id) {
  return state.dishes.find(dish => dish.id === id);
}

function media(dish, extraClass = "") {
  if (safeImage(dish?.image)) return `<img class="dish-photo ${extraClass}" src="${dish.image}" alt="${escapeHtml(dish.name)}">`;
  const colors = dish?.colors || [];
  return `<span class="plate ${extraClass}" style="--food1:${safeColor(colors[0], "#dba91e")};--food2:${safeColor(colors[1], "#63358a")}" aria-hidden="true"></span>`;
}

function bookDoodle() {
  return `
    <svg viewBox="0 0 300 230" role="img" aria-label="手绘菜单册">
      <path class="sketch" d="M61 25q-9 9-5 21v145q4 13 15 9l170-9V32L67 25Z"/>
      <path class="sketch" d="M55 46H43m12 21H41m14 21H43m12 21H41m14 21H43m12 21H41m14 21H43"/>
      <text class="sketch-text" x="88" y="78" font-size="17">HUANG</text>
      <text class="sketch-text" x="78" y="116" font-size="36">MENU</text>
      <path class="sketch" d="M101 137q-22 4-24 23t27 20q21-3 16-22m-20-9v11m-8-5 4 9m13-11-3 9m52-24q23-5 34 8t-2 35m-28-31q19-1 21 15m-21-15-7 28m29-11 12 12"/>
      <circle class="sketch-fill" cx="111" cy="202" r="4"/><circle class="sketch-fill" cx="145" cy="202" r="4"/><circle class="sketch-fill" cx="179" cy="202" r="4"/>
    </svg>`;
}

function fridgeDoodle() {
  return `
    <svg viewBox="0 0 250 220" role="img" aria-label="手绘冰箱和等待补货的小团子">
      <path class="sketch" d="M124 34h79l8 15v129l-12 10h-75V34Zm0 73h86M139 55v28m0 45v24"/>
      <path class="sketch" d="M46 111q13-20 37-8 28-10 39 13 14 25-8 44-18 16-43 3-22 3-30-17-7-18 5-35Z"/>
      <circle class="sketch-fill" cx="74" cy="132" r="3"/><circle class="sketch-fill" cx="93" cy="132" r="3"/>
      <path class="sketch" d="M74 146q9 7 19 0m-17-47-6-14m19 15 4-16m16 25 12-10"/>
      <text class="sketch-text" x="40" y="72" font-size="14">快点补货呢</text>
    </svg>`;
}

function shareIcon() {
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 16V3m0 0L7 8m5-5 5 5M5 13v7h14v-7"/></svg>`;
}

function formatDayLabel() {
  return new Intl.DateTimeFormat("zh-CN", { month: "long", day: "numeric", weekday: "long" }).format(new Date());
}

function renderMealPlan(day, title, subtitle) {
  const dishes = state.plans[day].map(getDish).filter(Boolean);
  return `
    <section class="meal-block" aria-labelledby="${day}Title">
      <div class="section-heading">
        <div><h2 class="section-title" id="${day}Title">${title}</h2><p class="section-subtitle">${subtitle}</p></div>
        <button class="soft-button compact-button" data-action="random-plan" data-day="${day}">随便来</button>
      </div>
      ${dishes.length ? `<div class="meal-scroll">${dishes.map(dish => `<button class="dish-card" data-action="dish-detail" data-id="${dish.id}">${media(dish)}<span class="dish-name">${escapeHtml(dish.name)}</span></button>`).join("")}</div>` : `<button class="empty-meal" data-action="random-plan" data-day="${day}">还没有安排，点我帮你想一道</button>`}
    </section>`;
}

function renderHome() {
  return `
    <section class="page" aria-labelledby="homeTitle">
      <div class="brand-row">
        <div><p class="eyebrow">黄大厨专属菜谱</p><p class="date-line">${formatDayLabel()}</p></div>
        <button class="icon-button" data-action="share-kitchen" aria-label="分享今日菜单">${shareIcon()}</button>
      </div>
      <h1 class="sr-only" id="homeTitle">今日食谱</h1>
      <div class="hero-doodle">${bookDoodle()}</div>
      <div class="segmented" role="group" aria-label="随机菜品来源">
        <button class="pill ${state.menuMode === "wanted" ? "is-active" : ""}" data-action="mode" data-value="wanted">我想吃的</button>
        <button class="pill ${state.menuMode === "cooked" ? "is-active" : ""}" data-action="mode" data-value="cooked">我烧过的</button>
      </div>
      ${renderMealPlan("today", "今日食谱", "今天认真吃一顿")}
      ${renderMealPlan("tomorrow", "明日食谱", "先把明天安排好")}
    </section>`;
}

function remainingDays(expiry) {
  const end = new Date(`${expiry}T12:00:00`);
  const start = new Date(`${dateKey()}T12:00:00`);
  return Number.isNaN(end.getTime()) ? 0 : Math.ceil((end - start) / 86400000);
}

function renderFridge() {
  const sorted = [...state.stock].sort((a, b) => remainingDays(a.expiry) - remainingDays(b.expiry));
  return `
    <section class="page" aria-labelledby="fridgeTitle">
      <div class="top-row"><div><p class="eyebrow">冰箱</p><h1 class="page-title" id="fridgeTitle">你好像又忘了什么…</h1></div><button class="primary-button compact-button" data-action="restock">补货</button></div>
      <div class="fridge-illustration">${fridgeDoodle()}</div>
      ${sorted.length ? `<div class="stock-list">${sorted.map(item => {
        const days = remainingDays(item.expiry);
        const tone = days < 0 ? "expired" : days <= 3 ? "soon" : "";
        const label = days < 0 ? `过期 ${Math.abs(days)} 天` : days === 0 ? "今天到期" : `剩 ${days} 天`;
        return `<button class="stock-item" data-action="stock-detail" data-id="${item.id}"><span><span class="stock-name">${escapeHtml(item.name)}</span><span class="stock-meta">${escapeHtml(item.note || `加入于 ${item.added}`)}</span></span><span class="stock-days ${tone}">${days < 0 ? Math.abs(days) : days}<small>${label}</small></span></button>`;
      }).join("")}</div>` : `<div class="empty-state"><p>冰箱还是空的，先补充一种食材吧。</p><button class="primary-button" data-action="restock">给小冰补货</button></div>`}
    </section>`;
}

function visibleDishes() {
  return state.dishes.filter(dish => (state.menuMode === "cooked" ? dish.cooked : !dish.cooked) && (state.categoryFilter === "全部" || dish.category === state.categoryFilter));
}

function renderMenu() {
  const visible = visibleDishes();
  const selected = visible.find(dish => dish.id === state.selectedDish) || visible[0];
  if (selected) state.selectedDish = selected.id;
  return `
    <section class="page" aria-labelledby="menuTitle">
      <div class="top-row">
        <div><p class="eyebrow">${state.menuMode === "cooked" ? "已有菜单" : "心愿菜单"}</p><h1 class="page-title" id="menuTitle">${state.menuMode === "cooked" ? "这就是我的实力！" : "食神啊，赋予我力量吧！"}</h1></div>
        <button class="icon-button" data-action="add-dish" aria-label="新增菜品">＋</button>
      </div>
      <div class="segmented" role="group" aria-label="菜单分组">
        <button class="pill ${state.menuMode === "cooked" ? "is-active" : ""}" data-action="mode" data-value="cooked">烧过的菜</button>
        <button class="pill ${state.menuMode === "wanted" ? "is-active" : ""}" data-action="mode" data-value="wanted">想吃的菜</button>
      </div>
      <div class="filter-row"><strong>餐桌</strong><select class="filter-select" id="categoryFilter" aria-label="按分类筛选"><option>全部</option>${CATEGORIES.map(category => `<option ${category === state.categoryFilter ? "selected" : ""}>${category}</option>`).join("")}</select></div>
      ${visible.length ? `<div class="dish-list">${visible.map(dish => `<button class="menu-card ${dish.id === state.selectedDish ? "is-selected" : ""}" data-action="select-menu" data-id="${dish.id}">${media(dish)}<span class="menu-copy"><strong>${escapeHtml(dish.name)}</strong><span>${escapeHtml(dish.category)} · ${dish.tags.length ? escapeHtml(dish.tags.join(" / ")) : dish.cooked ? "烧过" : "想吃"}</span></span><span class="menu-arrow" aria-hidden="true">›</span></button>`).join("")}</div>
      <div class="menu-actions"><button class="primary-button" data-action="arrange" ${selected ? "" : "disabled"}>安排</button><button class="soft-button" data-action="edit-dish" ${selected ? "" : "disabled"}>编辑</button><button class="soft-button" data-action="recipe" ${selected ? "" : "disabled"}>菜谱图</button></div>` : `<div class="empty-state"><p>这里还空空的，新增一道菜吧。</p><button class="primary-button" data-action="add-dish">新增菜品</button></div>`}
    </section>`;
}

function weeklyHistory() {
  const start = dateKey(-6);
  return state.history.filter(item => item.date >= start && getDish(item.dishId));
}

function renderProfile() {
  const weekly = weeklyHistory();
  const counts = new Map();
  weekly.forEach(item => counts.set(item.dishId, (counts.get(item.dishId) || 0) + 1));
  const favoriteId = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  const favorite = getDish(favoriteId) || state.dishes.find(dish => dish.cooked) || state.dishes[0];
  const distinct = new Set(weekly.map(item => item.dishId)).size;
  const expired = state.stock.filter(item => remainingDays(item.expiry) < 0).length;
  const expiredPercent = state.stock.length ? Math.round(expired / state.stock.length * 100) : 0;
  return `
    <section class="page" aria-labelledby="profileTitle">
      <div class="profile-hero">
        <div class="top-row"><div class="report-feature"><span class="avatar" aria-hidden="true">${escapeHtml(state.profileName.slice(0, 1))}</span><div><p class="eyebrow">我的</p><h1 class="page-title" id="profileTitle">今天有好好吃饭吗？</h1><p class="date-line">${escapeHtml(state.profileName)}的厨房</p></div></div><button class="text-button" data-action="edit-profile">编辑</button></div>
      </div>
      <article class="report-card">
        <h2>本周大吃货总结！</h2>
        <div class="report-feature">${media(favorite)}<div><strong class="report-number">${weekly.length}</strong><span>次饮食记录</span></div></div>
        <p class="report-copy">${weekly.length ? `最常出现的是「${escapeHtml(favorite.name)}」，本周吃过 ${distinct} 道不同的菜。` : "本周还没有归档的食谱，安排一道今日菜谱就会留下记录。"}</p>
        <div class="stat-grid"><div class="stat"><strong>${state.totalCooked}</strong><span>累计记录</span></div><div class="stat"><strong>${state.dishes.length}</strong><span>菜单总数</span></div><div class="stat"><strong>${expiredPercent}%</strong><span>过期占比</span></div></div>
      </article>
      <div class="settings" aria-label="厨房设置">
        <div class="settings-row"><span>分享与保存</span><span class="settings-actions"><button class="soft-button compact-button" data-action="share-kitchen">分享</button><button class="soft-button compact-button" data-action="save-report">保存周报</button></span></div>
        <div class="settings-row"><span>背景音乐</span><label class="toggle"><input id="bgmToggle" type="checkbox" ${state.settings.bgm ? "checked" : ""} aria-label="开启背景音乐"><span aria-hidden="true"></span></label></div>
        <div class="settings-row"><span>音乐风格</span><span class="settings-actions"><button class="chip ${state.settings.bgmMode === "sunny" ? "is-selected" : ""}" data-action="bgm-mode" data-value="sunny">明亮</button><button class="chip ${state.settings.bgmMode === "violet" ? "is-selected" : ""}" data-action="bgm-mode" data-value="violet">安静</button></span></div>
        <div class="settings-row"><span>语言 / Language</span><select class="filter-select" id="languageSelect" aria-label="语言"><option value="system" ${state.settings.language === "system" ? "selected" : ""}>跟随系统</option><option value="zh-CN" ${state.settings.language === "zh-CN" ? "selected" : ""}>简体中文</option></select></div>
        <div class="settings-row"><span>数据迁移</span><span class="settings-actions"><button class="soft-button compact-button" data-action="export-data">导出</button><label class="soft-button compact-button file-button" for="importFile">导入</label><input class="sr-only" id="importFile" type="file" accept="application/json,.json"></span></div>
      </div>
      <p class="privacy-note">菜谱、图片、冰箱、计划和统计只保存在当前浏览器中。导出备份后，可在另一台设备再次导入。</p>
    </section>`;
}

function render() {
  const pages = { home: renderHome, menu: renderMenu, fridge: renderFridge, profile: renderProfile };
  app.innerHTML = pages[state.tab]();
  document.querySelectorAll(".tab-button").forEach(button => {
    const active = button.dataset.tab === state.tab;
    button.classList.toggle("is-active", active);
    active ? button.setAttribute("aria-current", "page") : button.removeAttribute("aria-current");
  });
  if (!saveState()) requestAnimationFrame(() => showToast("本机存储空间不足，请先导出备份"));
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("is-visible");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("is-visible"), 2200);
}

function openSheet(markup) {
  sheetBody.innerHTML = markup;
  sheet.hidden = false;
  backdrop.hidden = false;
  document.body.style.overflow = "hidden";
  requestAnimationFrame(() => sheet.querySelector("input, textarea, button:not(.sheet-close), select")?.focus());
}

function closeSheet() {
  sheet.hidden = true;
  backdrop.hidden = true;
  document.body.style.overflow = "";
  sheetBody.innerHTML = "";
}

function dishForm(dish = {}) {
  pendingImage = safeImage(dish.image);
  const id = escapeHtml(dish.id || "");
  const selectedCategory = CATEGORIES.includes(dish.category) ? dish.category : "主菜";
  const ingredients = escapeHtml((dish.ingredients || []).join("\n"));
  const steps = escapeHtml((dish.steps || []).join("\n"));
  return `
    <h2 class="sheet-title" id="sheetTitle">${dish.id ? "编辑菜品" : "新增菜品"}</h2>
    <p class="sheet-subtitle">把菜名、食材、做法和照片一次记完整。</p>
    <form id="dishForm">
      <input type="hidden" name="dishId" value="${id}">
      <div class="field"><label for="dishName">菜的名字 *</label><input id="dishName" name="dishName" value="${escapeHtml(dish.name || "")}" maxlength="24" required placeholder="例如：青椒炒牛肉"></div>
      <div class="field"><label>分类 *</label><div class="chip-row">${CATEGORIES.map(category => `<button type="button" class="chip ${category === selectedCategory ? "is-selected" : ""}" data-category="${category}">${category}</button>`).join("")}</div><input type="hidden" name="category" value="${selectedCategory}"></div>
      <div class="field"><label for="dishTags">我的标签</label><input id="dishTags" name="tags" value="${escapeHtml((dish.tags || []).join("，"))}" maxlength="140" placeholder="例如：快手菜，周末"><p class="field-hint">用逗号分隔，最多保留 8 个。</p></div>
      <div class="field"><label>放进哪里</label><div class="chip-row"><button type="button" class="chip ${dish.cooked !== false ? "is-selected" : ""}" data-cooked="true">我烧过的</button><button type="button" class="chip ${dish.cooked === false ? "is-selected" : ""}" data-cooked="false">我想吃的</button></div><input type="hidden" name="cooked" value="${dish.cooked === false ? "false" : "true"}"></div>
      <div class="field"><label for="recipeUrl">菜谱链接（可选）</label><input id="recipeUrl" name="recipeUrl" type="url" value="${escapeHtml(dish.recipeUrl || "")}" maxlength="500" placeholder="https://"><p class="field-hint">仅接受 http / https 链接。</p></div>
      <div class="field"><label for="ingredients">食材</label><textarea id="ingredients" name="ingredients" maxlength="1600" placeholder="每行一种食材">${ingredients}</textarea></div>
      <div class="field"><label for="steps">做法</label><textarea id="steps" name="steps" maxlength="2600" placeholder="每行一个步骤">${steps}</textarea></div>
      <div class="field"><label for="dishNote">备注</label><textarea id="dishNote" name="note" maxlength="240" placeholder="口味、火候或想和谁一起吃">${escapeHtml(dish.note || "")}</textarea></div>
      <div class="field"><label>菜的肖像</label><div class="file-actions"><label class="file-button" for="dishCamera">拍照</label><label class="file-button" for="dishGallery">从相册添加</label></div><input class="sr-only" id="dishCamera" type="file" accept="image/jpeg,image/png,image/webp" capture="environment" data-image-input><input class="sr-only" id="dishGallery" type="file" accept="image/jpeg,image/png,image/webp" data-image-input><div class="image-preview" id="imagePreview">${pendingImage ? `<img src="${pendingImage}" alt="菜品预览">` : "还没有照片"}</div></div>
      <button class="primary-button block-button" type="submit">保存菜品</button>
    </form>`;
}

function stockForm() {
  return `
    <h2 class="sheet-title" id="sheetTitle">给冰箱补货</h2>
    <p class="sheet-subtitle">小冰，这次就拜托你了！</p>
    <form id="stockForm">
      <div class="field"><label for="stockName">名字 *</label><input id="stockName" name="stockName" required maxlength="24" placeholder="例如：西兰花"></div>
      <div class="field"><label>保质期</label><div class="chip-row">${EXPIRY_PRESETS.map((days, index) => `<button type="button" class="chip ${index === 2 ? "is-selected" : ""}" data-expiry-days="${days}">${days === 0 ? "当天" : `${days} 天`}</button>`).join("")}</div><input type="hidden" name="expiryDays" value="7"></div>
      <div class="field"><label for="expiryDate">或选择到期日</label><input id="expiryDate" name="expiryDate" type="date" min="${dateKey()}" value="${addDays(dateKey(), 7)}"></div>
      <div class="field"><label for="stockNote">备注</label><textarea id="stockNote" name="note" maxlength="160" placeholder="放在哪层、准备做什么"></textarea></div>
      <button class="primary-button block-button" type="submit">放进冰箱</button>
    </form>`;
}

function scheduleSheet(dish) {
  return `
    <h2 class="sheet-title" id="sheetTitle">安排「${escapeHtml(dish.name)}」</h2>
    <p class="sheet-subtitle">今天吃，还是留给明天？</p>
    <div class="detail-cover">${media(dish)}</div>
    <div class="detail-actions"><button class="primary-button" data-action="schedule-direct" data-id="${dish.id}" data-day="today">今天吃</button><button class="soft-button" data-action="schedule-direct" data-id="${dish.id}" data-day="tomorrow">明天吃</button></div>`;
}

function dishDetail(dish) {
  const ingredients = dish.ingredients.length ? `<ul>${dish.ingredients.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` : `<p class="field-hint">还没有记录食材。</p>`;
  const steps = dish.steps.length ? `<ol>${dish.steps.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ol>` : `<p class="field-hint">还没有记录做法。</p>`;
  const recipeLink = dish.recipeUrl ? `<a class="soft-button file-button block-button" href="${escapeHtml(dish.recipeUrl)}" target="_blank" rel="noopener noreferrer">打开原菜谱</a>` : "";
  return `
    <h2 class="sheet-title" id="sheetTitle">${escapeHtml(dish.name)}</h2>
    <p class="sheet-subtitle">${escapeHtml(dish.note || "这道菜还没有备注。")}</p>
    <div class="detail-cover">${media(dish)}</div>
    <div class="badge-row"><span class="badge">${escapeHtml(dish.category)}</span><span class="badge">${dish.cooked ? "我烧过的" : "我想吃的"}</span>${dish.tags.map(tag => `<span class="badge">${escapeHtml(tag)}</span>`).join("")}</div>
    <section class="recipe-section"><h3>食材</h3>${ingredients}</section>
    <section class="recipe-section"><h3>做法</h3>${steps}</section>
    ${recipeLink}
    <div class="detail-actions"><button class="primary-button" data-action="open-schedule" data-id="${dish.id}">安排</button><button class="soft-button" data-action="open-edit" data-id="${dish.id}">编辑</button><button class="soft-button block-button" data-action="open-recipe" data-id="${dish.id}">生成菜谱图</button></div>`;
}

function recipePreview(dish) {
  const templateClass = recipeOptions.template === "violet" ? "violet" : recipeOptions.template === "paper" ? "paper" : "";
  const ratioClass = recipeOptions.ratio === "wide" ? "is-wide" : "";
  return `<article class="recipe-preview ${templateClass} ${ratioClass}"><h3>${escapeHtml(dish.name)}</h3><p class="recipe-date">${formatDayLabel()} · 黄大厨专属菜谱</p><h4>食材</h4>${dish.ingredients.length ? `<ul>${dish.ingredients.slice(0, 7).map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` : "<p>按自己的口味准备食材</p>"}<h4>做法</h4>${dish.steps.length ? `<ol>${dish.steps.slice(0, 6).map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ol>` : "<p>把你的做法补充进来吧</p>"}</article>`;
}

function recipeGenerator(dish) {
  recipeOptions.dishId = dish.id;
  return `
    <h2 class="sheet-title" id="sheetTitle">生成菜谱图</h2>
    <p class="sheet-subtitle">选择模板和比例，生成后可以保存或分享。</p>
    <div class="recipe-tools">
      <div class="option-row"><strong>模板</strong><div class="template-options">${["sun", "violet", "paper"].map(template => `<button class="template-swatch ${recipeOptions.template === template ? "is-selected" : ""}" data-template="${template}" aria-label="${template === "sun" ? "黄色模板" : template === "violet" ? "紫色模板" : "白色模板"}"></button>`).join("")}</div></div>
      <div class="option-row"><strong>图片比例</strong><div class="chip-row"><button class="chip ${recipeOptions.ratio === "long" ? "is-selected" : ""}" data-ratio="long">长图</button><button class="chip ${recipeOptions.ratio === "wide" ? "is-selected" : ""}" data-ratio="wide">4:3</button></div></div>
    </div>
    ${recipePreview(dish)}
    <div class="detail-actions"><button class="primary-button" data-action="download-recipe">保存到相册</button><button class="soft-button" data-action="share-recipe">分享给朋友</button><button class="soft-button block-button" data-action="open-edit" data-id="${dish.id}">返回调整菜品</button></div>`;
}

function stockDetail(item) {
  const days = remainingDays(item.expiry);
  return `
    <h2 class="sheet-title" id="sheetTitle">${escapeHtml(item.name)}</h2>
    <p class="sheet-subtitle">${days < 0 ? `已过期 ${Math.abs(days)} 天` : days === 0 ? "今天到期" : `还可以保存 ${days} 天`}</p>
    <section class="recipe-section"><h3>保质信息</h3><p>加入日期：${item.added}<br>到期日期：${item.expiry}</p></section>
    <section class="recipe-section"><h3>备注</h3><p>${escapeHtml(item.note || "没有备注")}</p></section>
    <button class="danger-button block-button" data-action="delete-stock" data-id="${item.id}">从冰箱移除</button>`;
}

function profileForm() {
  return `<h2 class="sheet-title" id="sheetTitle">编辑个人信息</h2><p class="sheet-subtitle">给自己的厨房留一个称呼。</p><form id="profileForm"><div class="field"><label for="profileName">昵称 *</label><input id="profileName" name="profileName" value="${escapeHtml(state.profileName)}" maxlength="20" required></div><button class="primary-button block-button" type="submit">保存</button></form>`;
}

function addPlan(day, dishId) {
  if (!getDish(dishId) || !["today", "tomorrow"].includes(day)) return false;
  const plan = state.plans[day];
  if (!plan.includes(dishId) && plan.length >= 8) return false;
  if (!plan.includes(dishId)) plan.push(dishId);
  if (day === "today" && !state.history.some(item => item.date === dateKey() && item.dishId === dishId)) {
    state.history.push({ date: dateKey(), dishId });
    state.history = state.history.slice(-400);
    state.totalCooked += 1;
  }
  return true;
}

function randomPlan(day) {
  const source = state.dishes.filter(dish => state.menuMode === "wanted" ? !dish.cooked : dish.cooked);
  const available = source.filter(dish => !state.plans[day].includes(dish.id));
  if (!available.length && source.length) return showToast("这一组菜都安排好啦");
  const pool = available.length ? available : state.dishes.filter(dish => !state.plans[day].includes(dish.id));
  const dish = pool[Math.floor(Math.random() * pool.length)];
  if (!dish) return showToast("菜单还是空的，先新增一道菜吧");
  if (!addPlan(day, dish.id)) return showToast("一天最多安排 8 道菜");
  render();
  showToast(`已为${day === "today" ? "今天" : "明天"}加入「${dish.name}」`);
}

async function shareText(title, text) {
  try {
    if (navigator.share) {
      await navigator.share({ title, text });
      return;
    }
    await navigator.clipboard.writeText(text);
    showToast("内容已复制，可以发给朋友了");
  } catch (error) {
    if (error?.name !== "AbortError") showToast("暂时无法分享，请稍后再试");
  }
}

function kitchenShareText() {
  const today = state.plans.today.map(getDish).filter(Boolean).map(dish => dish.name).join("、") || "还没安排";
  const tomorrow = state.plans.tomorrow.map(getDish).filter(Boolean).map(dish => dish.name).join("、") || "还没安排";
  return `黄大厨的今日菜单：${today}\n明日菜单：${tomorrow}`;
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.hidden = true;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function wrapCanvasText(context, text, x, y, maxWidth, lineHeight, maxLines = 8) {
  const characters = [...String(text)];
  let line = "";
  let lines = 0;
  for (const character of characters) {
    const test = line + character;
    if (context.measureText(test).width > maxWidth && line) {
      context.fillText(line, x, y);
      y += lineHeight;
      line = character;
      lines += 1;
      if (lines >= maxLines) return y;
    } else {
      line = test;
    }
  }
  if (line && lines < maxLines) {
    context.fillText(line, x, y);
    y += lineHeight;
  }
  return y;
}

function canvasBlob(canvas) {
  return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("图片生成失败")), "image/png"));
}

function loadCanvasImage(dataUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = dataUrl;
  });
}

async function makeRecipeBlob(dish) {
  const wide = recipeOptions.ratio === "wide";
  const canvas = document.createElement("canvas");
  canvas.width = wide ? 1200 : 1080;
  canvas.height = wide ? 900 : 1600;
  const context = canvas.getContext("2d");
  const palette = recipeOptions.template === "violet"
    ? { background: "#63358a", ink: "#fffaf0", accent: "#f6cf4a", panel: "#73449a" }
    : recipeOptions.template === "paper"
      ? { background: "#fffaf0", ink: "#3f165f", accent: "#f6cf4a", panel: "#ffffff" }
      : { background: "#fff3b0", ink: "#3f165f", accent: "#63358a", panel: "#fffaf0" };
  context.fillStyle = palette.background;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = palette.accent;
  context.fillRect(0, 0, canvas.width, wide ? 26 : 34);
  let y = wide ? 90 : 120;
  const margin = wide ? 78 : 88;
  const maxWidth = canvas.width - margin * 2;
  if (dish.image) {
    try {
      const image = await loadCanvasImage(dish.image);
      const imageHeight = wide ? 250 : 360;
      const scale = Math.max(maxWidth / image.width, imageHeight / image.height);
      const width = image.width * scale;
      const height = image.height * scale;
      context.save();
      context.beginPath();
      context.rect(margin, y, maxWidth, imageHeight);
      context.clip();
      context.drawImage(image, margin + (maxWidth - width) / 2, y + (imageHeight - height) / 2, width, height);
      context.restore();
      y += imageHeight + (wide ? 38 : 54);
    } catch {
      y += 10;
    }
  }
  context.fillStyle = palette.ink;
  context.font = `800 ${wide ? 54 : 66}px "Microsoft YaHei", sans-serif`;
  y = wrapCanvasText(context, dish.name, margin, y, maxWidth, wide ? 66 : 78, 2);
  context.globalAlpha = 0.72;
  context.font = `500 ${wide ? 23 : 28}px "Microsoft YaHei", sans-serif`;
  context.fillText(`${formatDayLabel()} · 黄大厨专属菜谱`, margin, y + 8);
  context.globalAlpha = 1;
  y += wide ? 56 : 78;
  const drawSection = (title, items, ordered) => {
    if (y > canvas.height - 120) return;
    context.fillStyle = palette.accent;
    context.font = `800 ${wide ? 30 : 36}px "Microsoft YaHei", sans-serif`;
    context.fillText(title, margin, y);
    y += wide ? 42 : 52;
    context.fillStyle = palette.ink;
    context.font = `500 ${wide ? 22 : 28}px "Microsoft YaHei", sans-serif`;
    (items.length ? items : [title === "食材" ? "按自己的口味准备食材" : "把你的做法补充进来吧"]).slice(0, wide ? 4 : 8).forEach((item, index) => {
      const prefix = ordered ? `${index + 1}. ` : "• ";
      y = wrapCanvasText(context, prefix + item, margin, y, maxWidth, wide ? 31 : 40, 3);
      y += wide ? 5 : 8;
    });
    y += wide ? 16 : 28;
  };
  drawSection("食材", dish.ingredients, false);
  drawSection("做法", dish.steps, true);
  context.fillStyle = palette.accent;
  context.fillRect(margin, canvas.height - (wide ? 62 : 84), wide ? 220 : 260, wide ? 8 : 10);
  return canvasBlob(canvas);
}

async function makeReportBlob() {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1350;
  const context = canvas.getContext("2d");
  const weekly = weeklyHistory();
  const distinct = new Set(weekly.map(item => item.dishId)).size;
  context.fillStyle = "#fff3b0";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#63358a";
  context.fillRect(0, 0, canvas.width, 34);
  context.fillStyle = "#3f165f";
  context.font = '800 64px "Microsoft YaHei", sans-serif';
  context.fillText(`${state.profileName}的本周厨房`, 86, 160);
  context.font = '500 30px "Microsoft YaHei", sans-serif';
  context.fillStyle = "#786b7d";
  context.fillText(`${dateKey(-6)} 至 ${dateKey()}`, 86, 218);
  const stats = [[weekly.length, "本周记录"], [distinct, "不同菜品"], [state.stock.length, "冰箱食材"]];
  stats.forEach(([number, label], index) => {
    const x = 86 + index * 310;
    context.fillStyle = "#ffffff";
    context.fillRect(x, 320, 270, 250);
    context.fillStyle = "#63358a";
    context.font = '800 76px "Microsoft YaHei", sans-serif';
    context.fillText(String(number), x + 28, 435);
    context.fillStyle = "#786b7d";
    context.font = '600 28px "Microsoft YaHei", sans-serif';
    context.fillText(label, x + 28, 505);
  });
  context.fillStyle = "#3f165f";
  context.font = '800 42px "Microsoft YaHei", sans-serif';
  context.fillText("今天也要好好吃饭", 86, 730);
  context.font = '500 32px "Microsoft YaHei", sans-serif';
  const today = state.plans.today.map(getDish).filter(Boolean).map(dish => dish.name).join("、") || "还没有安排今日菜单";
  wrapCanvasText(context, `今日菜单：${today}`, 86, 810, 900, 48, 5);
  context.fillStyle = "#dba91e";
  context.fillRect(86, 1180, 280, 12);
  return canvasBlob(canvas);
}

function exportData() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  downloadBlob(blob, `huang-kitchen-${dateKey()}.json`);
  showToast("厨房数据已导出");
}

async function importData(file) {
  if (!file || file.size > MAX_IMPORT_BYTES || !file.name.toLowerCase().endsWith(".json")) throw new Error("请选择 8MB 以内的 JSON 备份文件");
  const parsed = JSON.parse(await file.text());
  if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.dishes)) throw new Error("这不是有效的厨房备份");
  const next = normalizeState(parsed);
  if (!next.dishes.length) throw new Error("备份中没有可用菜品");
  if (!window.confirm("导入会覆盖当前厨房数据，确定继续吗？")) return false;
  state = next;
  render();
  showToast("厨房数据已导入");
  return true;
}

async function compressImage(file) {
  if (!file || file.size > MAX_IMAGE_BYTES || !["image/jpeg", "image/png", "image/webp"].includes(file.type)) throw new Error("请选择 5MB 以内的 JPG、PNG 或 WebP 图片");
  let bitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error("图片内容无法识别");
  }
  const scale = Math.min(1, 900 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext("2d");
  context.fillStyle = "#fff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const result = canvas.toDataURL("image/jpeg", 0.78);
  if (result.length > 900000) throw new Error("图片压缩后仍然太大，请换一张小图");
  return result;
}

async function startBgm() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return showToast("当前浏览器不支持背景音乐");
    bgmContext ||= new AudioContextClass();
    await bgmContext.resume();
    const playTone = () => {
      if (!state.settings.bgm || !bgmContext) return;
      const notes = state.settings.bgmMode === "violet" ? [220, 261.6, 293.7, 261.6] : [329.6, 392, 440, 392];
      const oscillator = bgmContext.createOscillator();
      const gain = bgmContext.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = notes[bgmStep++ % notes.length];
      gain.gain.setValueAtTime(0.0001, bgmContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.035, bgmContext.currentTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, bgmContext.currentTime + 0.48);
      oscillator.connect(gain).connect(bgmContext.destination);
      oscillator.start();
      oscillator.stop(bgmContext.currentTime + 0.5);
    };
    clearInterval(bgmTimer);
    playTone();
    bgmTimer = setInterval(playTone, 1100);
  } catch {
    state.settings.bgm = false;
    saveState();
    showToast("背景音乐启动失败");
  }
}

function stopBgm() {
  clearInterval(bgmTimer);
  bgmTimer = null;
  if (bgmContext?.state === "running") void bgmContext.suspend().catch(() => {});
}

document.querySelector(".tab-bar").addEventListener("click", event => {
  const button = event.target.closest(".tab-button");
  if (!button) return;
  state.tab = button.dataset.tab;
  render();
  app.scrollTop = 0;
  app.focus({ preventScroll: true });
});

app.addEventListener("click", async event => {
  const target = event.target.closest("[data-action]");
  if (!target) return;
  const action = target.dataset.action;
  if (action === "mode") {
    state.menuMode = target.dataset.value === "wanted" ? "wanted" : "cooked";
    state.selectedDish = visibleDishes()[0]?.id || "";
    render();
  }
  if (action === "random-plan") randomPlan(target.dataset.day);
  if (action === "share-kitchen") await shareText("黄大厨专属菜谱", kitchenShareText());
  if (action === "dish-detail") {
    const dish = getDish(target.dataset.id);
    if (dish) openSheet(dishDetail(dish));
  }
  if (action === "restock") openSheet(stockForm());
  if (action === "stock-detail") {
    const item = state.stock.find(stock => stock.id === target.dataset.id);
    if (item) openSheet(stockDetail(item));
  }
  if (action === "add-dish") openSheet(dishForm());
  if (action === "select-menu") {
    state.selectedDish = target.dataset.id;
    render();
  }
  if (["arrange", "edit-dish", "recipe"].includes(action)) {
    const dish = getDish(state.selectedDish) || visibleDishes()[0];
    if (!dish) return showToast("先新增一道菜吧");
    if (action === "arrange") openSheet(scheduleSheet(dish));
    if (action === "edit-dish") openSheet(dishForm(dish));
    if (action === "recipe") {
      recipeOptions = { dishId: dish.id, template: "sun", ratio: "long" };
      openSheet(recipeGenerator(dish));
    }
  }
  if (action === "edit-profile") openSheet(profileForm());
  if (action === "bgm-mode") {
    state.settings.bgmMode = target.dataset.value === "violet" ? "violet" : "sunny";
    saveState();
    render();
    if (state.settings.bgm) await startBgm();
  }
  if (action === "export-data") exportData();
  if (action === "save-report") {
    try {
      downloadBlob(await makeReportBlob(), `huang-weekly-${dateKey()}.png`);
      showToast("本周回顾图片已生成");
    } catch {
      showToast("周报图片生成失败");
    }
  }
});

app.addEventListener("change", async event => {
  if (event.target.id === "categoryFilter") {
    state.categoryFilter = event.target.value;
    state.selectedDish = "";
    render();
  }
  if (event.target.id === "bgmToggle") {
    state.settings.bgm = event.target.checked;
    saveState();
    state.settings.bgm ? await startBgm() : stopBgm();
  }
  if (event.target.id === "languageSelect") {
    state.settings.language = event.target.value === "zh-CN" ? "zh-CN" : "system";
    saveState();
    showToast("语言设置已保存");
  }
  if (event.target.id === "importFile") {
    try {
      if (!await importData(event.target.files[0])) showToast("已取消导入");
    } catch (error) {
      showToast(error.message || "导入失败");
    }
    event.target.value = "";
  }
});

sheet.addEventListener("click", async event => {
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
  const expiry = event.target.closest("[data-expiry-days]");
  if (expiry) {
    expiry.parentElement.querySelectorAll(".chip").forEach(chip => chip.classList.toggle("is-selected", chip === expiry));
    const field = expiry.closest("form");
    field.elements.expiryDays.value = expiry.dataset.expiryDays;
    field.elements.expiryDate.value = addDays(dateKey(), Number(expiry.dataset.expiryDays));
  }
  const template = event.target.closest("[data-template]");
  if (template) {
    recipeOptions.template = template.dataset.template;
    const dish = getDish(recipeOptions.dishId);
    if (dish) openSheet(recipeGenerator(dish));
  }
  const ratio = event.target.closest("[data-ratio]");
  if (ratio) {
    recipeOptions.ratio = ratio.dataset.ratio;
    const dish = getDish(recipeOptions.dishId);
    if (dish) openSheet(recipeGenerator(dish));
  }
  const actionTarget = event.target.closest("[data-action]");
  if (!actionTarget) return;
  const action = actionTarget.dataset.action;
  const dish = getDish(actionTarget.dataset.id || recipeOptions.dishId);
  if (action === "open-schedule" && dish) openSheet(scheduleSheet(dish));
  if (action === "open-edit" && dish) openSheet(dishForm(dish));
  if (action === "open-recipe" && dish) {
    recipeOptions = { dishId: dish.id, template: "sun", ratio: "long" };
    openSheet(recipeGenerator(dish));
  }
  if (action === "schedule-direct" && dish) {
    if (!addPlan(actionTarget.dataset.day, dish.id)) return showToast("一天最多安排 8 道菜");
    closeSheet();
    state.tab = "home";
    render();
    showToast(`已安排到${actionTarget.dataset.day === "today" ? "今天" : "明天"}`);
  }
  if (action === "delete-stock") {
    state.stock = state.stock.filter(item => item.id !== actionTarget.dataset.id);
    closeSheet();
    render();
    showToast("食材已从冰箱移除");
  }
  if (action === "download-recipe" && dish) {
    try {
      downloadBlob(await makeRecipeBlob(dish), `${dish.name}-菜谱.png`);
      showToast("菜谱图已生成");
    } catch {
      showToast("菜谱图生成失败");
    }
  }
  if (action === "share-recipe" && dish) {
    try {
      const blob = await makeRecipeBlob(dish);
      const filename = `${dish.name}-菜谱.png`;
      const file = typeof File === "function" ? new File([blob], filename, { type: "image/png" }) : null;
      if (file && navigator.share && navigator.canShare?.({ files: [file] })) await navigator.share({ title: dish.name, files: [file] });
      else {
        downloadBlob(blob, filename);
        showToast("浏览器不支持图片分享，已改为下载");
      }
    } catch (error) {
      if (error?.name !== "AbortError") showToast("分享失败，请稍后再试");
    }
  }
});

sheet.addEventListener("change", async event => {
  if (!event.target.matches("[data-image-input]")) return;
  try {
    pendingImage = await compressImage(event.target.files[0]);
    document.querySelector("#imagePreview").innerHTML = `<img src="${pendingImage}" alt="菜品预览">`;
  } catch (error) {
    showToast(error.message || "图片处理失败");
  }
  event.target.value = "";
});

sheet.addEventListener("submit", event => {
  event.preventDefault();
  const data = new FormData(event.target);
  if (event.target.id === "dishForm") {
    const name = cleanText(data.get("dishName"), 24);
    if (!name) return showToast("请输入菜名");
    const recipeUrlInput = cleanText(data.get("recipeUrl"), 500);
    const recipeUrl = safeUrl(recipeUrlInput);
    if (recipeUrlInput && !recipeUrl) return showToast("菜谱链接仅支持 http 或 https");
    const id = cleanText(data.get("dishId"), 80);
    const existing = getDish(id);
    const next = {
      id: existing?.id || uid("dish"),
      name,
      category: CATEGORIES.includes(data.get("category")) ? data.get("category") : "其他",
      cooked: data.get("cooked") === "true",
      colors: existing?.colors || ["#dba91e", "#63358a"],
      note: cleanText(data.get("note"), 240),
      recipeUrl,
      tags: normalizeStringList(String(data.get("tags") || "").split(/[,，、\n]/), 8).map(tag => tag.slice(0, 16)),
      ingredients: normalizeStringList(data.get("ingredients")),
      steps: normalizeStringList(data.get("steps"), 16),
      image: safeImage(pendingImage)
    };
    if (existing) Object.assign(existing, next);
    else state.dishes.push(next);
    state.selectedDish = next.id;
    state.menuMode = next.cooked ? "cooked" : "wanted";
    closeSheet();
    render();
    showToast(existing ? "菜品已更新" : "新菜加入菜单啦");
  }
  if (event.target.id === "stockForm") {
    const name = cleanText(data.get("stockName"), 24);
    if (!name) return showToast("请输入食材名称");
    const expiryDate = /^\d{4}-\d{2}-\d{2}$/.test(String(data.get("expiryDate"))) ? String(data.get("expiryDate")) : addDays(dateKey(), Number(data.get("expiryDays")) || 7);
    state.stock.unshift({ id: uid("stock"), name, added: dateKey(), expiry: expiryDate, note: cleanText(data.get("note"), 160) });
    closeSheet();
    render();
    showToast("已经放进冰箱了");
  }
  if (event.target.id === "profileForm") {
    const name = cleanText(data.get("profileName"), 20);
    if (!name) return showToast("请输入昵称");
    state.profileName = name;
    closeSheet();
    render();
    showToast("个人信息已更新");
  }
});

document.querySelector("#sheetClose").addEventListener("click", closeSheet);
backdrop.addEventListener("click", closeSheet);
document.addEventListener("keydown", event => {
  if (event.key === "Escape" && !sheet.hidden) closeSheet();
});
document.addEventListener("pointerdown", () => {
  if (state.settings.bgm && !bgmTimer) void startBgm();
}, { once: true });

render();
