import { SUPABASE_URL, SUPABASE_KEY } from "./config.js";
import { toast } from "./ui.js";

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const TOKEN_KEY = "appcore_profile_token";
const WHATSAPP_NUMBER = "79289480706";
const DAY_MS = 24 * 60 * 60 * 1000;
const POLL_MS = 20000;

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
    const links = {};
    (o.install_links || []).forEach(l => { links[l.id] = l.install; });

    (o.apps || []).forEach(a => {
      const row = make("div", "app-row");
      row.append(make("span", "", a.name));

      const url = links[a.id];
      if (typeof url === "string" && url.startsWith("https://")) {
        const link = make("a", "install-btn", "Установить");
        link.href = url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        row.append(link);
      }

      card.append(row);
    });

    card.append(make("div", "order-hint",
      "После установки приложениям нужна активация — без неё они не заработают."));

    const wa = make("a", "wa-btn", "💬 Получить инструкцию по активации");
    wa.href = waLink(orderText(o, "Здравствуйте!\n\nХочу активировать приложения.",
      "Статус: оплата подтверждена. Все приложения установлены."));
    wa.target = "_blank";
    wa.rel = "noopener noreferrer";
    card.append(wa);

  } else if (o.status === "awaiting_review") {
    const names = (o.apps || []).map(a => a.name).join(", ");
    card.append(make("div", "order-hint", "Приложения: " + names));
    card.append(make("div", "order-hint",
      "Реквизиты для оплаты мы пришлём в WhatsApp. После подтверждения оплаты здесь появятся кнопки установки."));

    const wa = make("a", "wa-btn", "💬 Написать в WhatsApp");
    wa.href = waLink(orderText(o, "Здравствуйте!\n\nПишу по моему заказу.",
      "Пришлите, пожалуйста, реквизиты для оплаты."));
    wa.target = "_blank";
    wa.rel = "noopener noreferrer";
    card.append(wa);
  }

  return card;
}

function render() {
  $("pName").textContent = profile.name || "Клиент";
  $("pId").textContent = profile.client_id;
  $("pPhone").textContent = "Телефон: " + profile.phone;

  $("orders").replaceChildren(...(profile.orders || []).map(orderCard));

  show("view");
  tick();
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
