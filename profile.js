import { SUPABASE_URL, SUPABASE_KEY } from "./config.js";
import { toast } from "./ui.js";

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const TOKEN_KEY = "appcore_profile_token";
const WHATSAPP_NUMBER = "79289480706";
const DAY_MS = 24 * 60 * 60 * 1000;
const POLL_MS = 20000;
const INSTALLED_ORDER_KEY = "appcore_installed_order";
const GUIDE_SEEN_KEY = "appcore_first_profile_install_guide";

const $ = id => document.getElementById(id);

let profile = null;
let offset = 0;        // разница между часами сервера и телефона
let reloadQueued = false;

const now = () => Date.now() + offset;

function money(v) {
  return Math.round(v || 0).toLocaleString("ru-RU") + " ₽";
}

function left(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h + " ч " + String(m).padStart(2, "0") + " мин " + String(sec).padStart(2, "0") + " с";
}

function make(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

function show(which) {
  $("loading").hidden = true;
  $("view").hidden = which !== "view";
  $("recover").hidden = which !== "recover";
}

function waLink(text) {
  return "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(text);
}

function orderText(o, intro, closing) {
  const names = (o.apps || []).map(a => a.name).join(", ");
  return intro + "\n\n" +
    "Имя: " + (profile.name || "—") + "\n" +
    "Телефон: " + profile.phone + "\n" +
    "Номер заказа: " + o.order_number + "\n" +
    "Приложения: " + names + "\n" +
    "Сумма: " + money(o.total) + "\n\n" + closing;
}

/* ---------- Вход / восстановление ---------- */

function showRecover(ended) {
  $("recTitle").textContent = ended ? "Срок профиля истёк" : "Войти в профиль";
  $("recText").textContent = ended
    ? "Срок хранения текущего профиля истёк. Чтобы продолжить, оформите новый заказ или восстановите доступ по действующему заказу."
    : "Введите телефон, который указывали при заказе, и номер заказа. Номер заказа показывается сразу после оформления.";
  show("recover");
}

$("guideClose").addEventListener("click", () => {
  try { localStorage.setItem(GUIDE_SEEN_KEY, "1"); } catch (e) {}
  $("firstInstallGuide").hidden = true;
});

$("recForm").addEventListener("submit", async e => {
  e.preventDefault();

  const phone = e.target.elements.phone.value.trim();
  const order = e.target.elements.order.value.trim().toUpperCase();
  const button = e.target.querySelector("[type=submit]");

  button.disabled = true;

  const { data, error } = await sb.rpc("recover_profile", {
    p_phone: phone,
    p_order_number: order
  });

  button.disabled = false;

  if (error) {
    toast((error.message || "").includes("RATE_LIMIT")
      ? "Слишком много попыток. Попробуйте через 15 минут."
      : "Не удалось войти, попробуйте позже");
    return;
  }

  if (!data) {
    toast("Профиль не найден. Проверьте телефон и номер заказа.");
    return;
  }

  try { localStorage.setItem(TOKEN_KEY, data); } catch (err) {}
  e.target.reset();
  load(true);
});

/* ---------- Отрисовка ---------- */

const STATUS = {
  awaiting_review: ["⏳ Ожидает оплаты", "wait"],
  paid: ["✅ Оплачен · активен", "ok"],
  completed: ["✅ Оплачен · активен", "ok"],
  cancelled: ["❌ Отменён", "bad"]
};

function isOrderInstalled(orderNumber) {
  try {
    const raw = localStorage.getItem(INSTALLED_ORDER_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) && list.includes(orderNumber);
  } catch (e) {
    return false;
  }
}

function activationWhatsapp(o) {
  const text = "Все приложения установлены и полностью загрузились. Пришлите инструкцию по активации";
  return waLink(text);
}

function orderCard(o) {
  const [label, cls] = STATUS[o.status] || [o.status, "wait"];
  const paid = o.status === "paid" || o.status === "completed";
  const card = make("div", "order");

  const top = make("div", "order-top");
  top.append(make("div", "order-num", o.order_number), make("span", "badge " + cls, label));
  card.append(top, make("div", "order-sum", "Сумма: " + money(o.total)));

  if (o.status !== "cancelled") {
    const timer = make("div", "order-left");
    timer.dataset.expires = o.expires_at;
    timer.dataset.kind = paid ? "paid" : "wait";
    card.append(timer);
  }

  if (paid) {
    const installExpires = Date.parse(o.expires_at);
    const installExpired = Number.isFinite(installExpires) && installExpires <= now();

    if (installExpired) {
      card.append(
        make("div", "expired-install", "🔒 Срок установки закончился"),
        make("div", "order-hint", "24-часовой срок установки этого заказа завершён. Установка приложений больше недоступна.")
      );
      return card;
    }

    const tabs = make("div", "order-tabs");
    const appsTab = make("button", "order-tab active", "1. ПРИЛОЖЕНИЯ");
    const installedIds = new Set();

    try {
      const raw = localStorage.getItem(INSTALLED_ORDER_KEY + "_" + o.order_number);
      const saved = raw ? JSON.parse(raw) : [];
      if (Array.isArray(saved)) saved.forEach(id => installedIds.add(id));
    } catch (e) {}

    const allInstalled = (o.apps || []).length > 0 &&
      (o.apps || []).every(a => installedIds.has(a.id));

    const activationTab = make(
      "button",
      "order-tab activation-tab" + (allInstalled ? " ready" : ""),
      "2. 🔐 АКТИВАЦИЯ"
    );
    activationTab.innerHTML = '2. <span>🔐 АКТИВАЦИЯ</span><small>⚠️ ОБЯЗАТЕЛЬНО</small>';
    activationTab.disabled = !allInstalled;
    tabs.append(appsTab, activationTab);
    card.append(tabs);

    const appsPane = make("div", "order-pane active");
    const activationPane = make("div", "order-pane activation-pane");

    const links = {};
    (o.install_links || []).forEach(l => { links[l.id] = l.install; });

    (o.apps || []).forEach(a => {
      const row = make("div", "app-row");
      row.append(make("span", "", a.name));
      const url = links[a.id];

      if (typeof url === "string" && url.startsWith("https://")) {
        const link = make("a", "install-btn" + (installedIds.has(a.id) ? " installed" : ""), installedIds.has(a.id) ? "✓ Установлено" : "Установить");
        link.href = url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";

        link.addEventListener("click", () => {
          setTimeout(() => {
            try {
              installedIds.add(a.id);
              localStorage.setItem(
                INSTALLED_ORDER_KEY + "_" + o.order_number,
                JSON.stringify([...installedIds])
              );
            } catch (e) {}
            render();
          }, 700);
        });

        row.append(link);
      }

      appsPane.append(row);
    });

    const hint = make(
      "div",
      "order-hint",
      allInstalled
        ? "✅ Все приложения отмечены как установленные. Теперь доступна активация."
        : "Установите каждое купленное приложение. После нажатия всех кнопок «Установить» станет доступна активация."
    );
    appsPane.append(hint);

    activationPane.append(
      make("div", "activation-title", "⚠️ ВНИМАТЕЛЬНО ОЗНАКОМЬТЕСЬ С ИНСТРУКЦИЕЙ"),
      make("div", "activation-copy", "Инструкция по активации выдаётся там, где вы получили заказ."),
      make("div", "activation-copy", "Если вы получили заказ через WhatsApp, нажмите кнопку ниже — откроется чат с готовым сообщением.")
    );

    const wa = make("a", "wa-btn", "💬 ПОЛУЧИТЬ ИНСТРУКЦИЮ");
    wa.href = activationWhatsapp(o);
    wa.target = "_blank";
    wa.rel = "noopener noreferrer";
    activationPane.append(wa);

    appsTab.addEventListener("click", () => {
      appsTab.classList.add("active");
      activationTab.classList.remove("active");
      appsPane.classList.add("active");
      activationPane.classList.remove("active");
    });

    activationTab.addEventListener("click", () => {
      const currentInstalled = (o.apps || []).every(a => installedIds.has(a.id));
      if (!currentInstalled) {
        toast("Сначала установите все приложения");
        return;
      }
      appsTab.classList.remove("active");
      activationTab.classList.add("active");
      appsPane.classList.remove("active");
      activationPane.classList.add("active");
    });

    card.append(appsPane, activationPane);

  } else if (o.status === "awaiting_review") {
    const names = (o.apps || []).map(a => a.name).join(", ");
    card.append(make("div", "order-hint", "Приложения: " + names));
    card.append(make("div", "order-hint",
      "Реквизиты для оплаты мы пришлём в WhatsApp. После подтверждения оплаты здесь появятся кнопки установки."));
    const wa = make("a", "wa-btn", "💬 Написать в WhatsApp");
    wa.href = waLink(orderText(o, "Здравствуйте!\n\nПишу по моему заказу.", "Пришлите, пожалуйста, реквизиты для оплаты."));
    wa.target = "_blank"; wa.rel = "noopener noreferrer";
    card.append(wa);
  }
  return card;
}

function maybeShowFirstGuide() {
  const paidOrders = (profile.orders || []).some(o => o.status === "paid" || o.status === "completed");
  if (!paidOrders) return;
  try {
    if (localStorage.getItem(GUIDE_SEEN_KEY) === "1") return;
  } catch (e) {}
  $("firstInstallGuide").hidden = false;
}

function render() {
  $("pName").textContent = profile.name || "Клиент";
  $("pId").textContent = profile.client_id;
  $("pPhone").textContent = "Телефон: " + profile.phone;

  $("orders").replaceChildren(...(profile.orders || []).map(orderCard));

  show("view");
  tick();
  maybeShowFirstGuide();
}

/* ---------- Отсчёт ---------- */

function tick() {
  if (!profile) return;

  const profileLeft = Date.parse(profile.expires_at) - now();

  $("pTimer").textContent = left(profileLeft);
  $("pBar").style.width = Math.min(100, Math.max(0, (profileLeft / DAY_MS) * 100)) + "%";

  let anyEnded = profileLeft <= 0;

  document.querySelectorAll("[data-expires]").forEach(el => {
    const ms = Date.parse(el.dataset.expires) - now();

    if (ms <= 0) {
      el.textContent = "Время вышло";
      anyEnded = true;
      return;
    }

    el.textContent = (el.dataset.kind === "paid"
      ? "Осталось на установку: "
      : "Заказ действует ещё: ") + left(ms);
  });

  if (anyEnded && !reloadQueued) {
    reloadQueued = true;
    setTimeout(() => { reloadQueued = false; load(); }, 1500);
  }
}

/* ---------- Загрузка ---------- */

async function load(manual) {
  let token = null;
  try { token = localStorage.getItem(TOKEN_KEY); } catch (e) {}

  if (!token) {
    showRecover(false);
    return;
  }

  const { data, error } = await sb.rpc("get_profile", { p_token: token });

  if (error) {
    console.error(error);
    if (!profile) {
      $("loading").textContent = "Не удалось загрузить профиль. Обновите страницу.";
    }
    return;
  }

  if (data.server_now) offset = Date.parse(data.server_now) - Date.now();

  if (!data.alive) {
    profile = null;
    showRecover(true);
    return;
  }

  profile = data;
  render();

  if (manual) toast("Профиль открыт");
}

load();
setInterval(tick, 1000);
setInterval(() => { if (!document.hidden) load(); }, POLL_MS);
document.addEventListener("visibilitychange", () => { if (!document.hidden) load(); });
