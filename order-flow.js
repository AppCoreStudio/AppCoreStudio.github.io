/*
 * order-flow.js — новый порядок оформления заказа (шаг 4).
 *
 * Подключается ОДНОЙ строкой в конце catalog.html:
 *   <script src="order-flow.js"></script>
 * Отключить = удалить эту строку.
 *
 * Что делает:
 *  - убирает реквизиты оплаты из окна заказа, добавляет поля «имя» и «телефон»;
 *  - кнопка внизу: «Заказать приложение · сумма», в окне: «Оформить заказ»;
 *  - создаёт заказ (Telegram срабатывает как раньше), сохраняет ключ профиля;
 *  - открывает WhatsApp с готовым текстом заказа.
 */
(function () {
  "use strict";

  var TOKEN_KEY = "appcore_profile_token";
  var NAME_KEY = "appcore_client_name";
  var busy = false;

  var modal = document.querySelector(".payment-modal");
  var oldButton = document.getElementById("paymentDone");
  var phoneField = document.getElementById("phoneInput");

  if (!modal || !oldButton || !phoneField) {
    console.error("order-flow: не найдены элементы окна заказа");
    return;
  }

  /* ---------- 1. Окно заказа ---------- */

  var title = modal.querySelector(".payment-title");
  if (title) title.textContent = "Оформление заказа";

  var subtitle = modal.querySelector(".payment-subtitle");
  if (subtitle) {
    subtitle.textContent =
      "Проверьте выбранные приложения и укажите имя и номер телефона. " +
      "Дальше мы продолжим оформление в WhatsApp.";
  }

  var totalLabel = modal.querySelector(".payment-total span:first-child");
  if (totalLabel) totalLabel.textContent = "Итого";

  // Убираем реквизиты оплаты (оставляем только блок с телефоном)
  var phoneBox = phoneField.closest(".requisite");

  modal.querySelectorAll(".requisite").forEach(function (el) {
    if (el !== phoneBox) el.remove();
  });

  var heads = modal.querySelectorAll(".requisites-title");
  if (heads[0]) heads[0].textContent = "Ваши данные";
  for (var i = 1; i < heads.length; i++) heads[i].remove();

  var note = modal.querySelector(".payment-note");
  if (note) {
    note.textContent =
      "💬 После нажатия откроется WhatsApp с готовым сообщением. " +
      "Реквизиты для оплаты мы пришлём там.";
  }

  // Поле «Ваше имя» над телефоном
  var nameBox = document.createElement("div");
  nameBox.className = "requisite";
  nameBox.innerHTML =
    '<div class="requisite-label">Ваше имя</div>' +
    '<div class="requisite-value-row">' +
    '<input id="nameInput" class="phone-input" type="text" ' +
    'autocomplete="given-name" maxlength="60" placeholder="Как к вам обращаться">' +
    "</div>";
  phoneBox.parentNode.insertBefore(nameBox, phoneBox);

  var nameField = nameBox.querySelector("input");
  try {
    nameField.value = localStorage.getItem(NAME_KEY) || "";
  } catch (e) {}

  // Новая кнопка вместо старой (старый обработчик «Я оплатил» отключается)
  var button = oldButton.cloneNode(false);
  button.id = "paymentDone";
  button.className = oldButton.className;
  button.type = "button";
  button.textContent = "Оформить заказ";
  oldButton.replaceWith(button);

  /* ---------- 2. Кнопка внизу ---------- */

  var origUpdatePrice = window.updatePrice;

  window.updatePrice = function () {
    origUpdatePrice();

    if (!continueButton.disabled) {
      continueButton.textContent =
        "Заказать приложение · " + money(calculatePrice(selected.size).total);
    }
  };

  window.updatePrice();

  /* ---------- 3. WhatsApp ---------- */

  function orderMessage(order) {
    var names = (order.apps || [])
      .map(function (a) { return a.name; })
      .join(", ");

    var text =
      "Здравствуйте!\n\nХочу оформить заказ.\n\n" +
      "Имя: " + (order.client_name || "—") + "\n" +
      "Телефон: " + order.client_phone + "\n" +
      "Номер заказа: " + order.order_number + "\n" +
      "Приложения: " + names + "\n" +
      "Количество: " + (order.apps || []).length + "\n" +
      "Сумма: " + money(order.total || 0);

    if (order.discount) {
      text += " (скидка " + money(order.discount) + ")";
    }

    text += "\n\nПришлите, пожалуйста, реквизиты для оплаты.";

    return text;
  }

  function waUrl(order) {
    return "https://wa.me/" + WHATSAPP_NUMBER +
      "?text=" + encodeURIComponent(orderMessage(order));
  }

  function ensureWhatsappButton(order) {
    var panel = document.getElementById("statusPanel");
    if (!panel) return;

    var link = document.getElementById("orderWhatsapp");

    if (!link) {
      link = document.createElement("a");
      link.id = "orderWhatsapp";
      link.className = "status-support-button";
      link.style.marginTop = "14px";
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = "💬 Продолжить заказ в WhatsApp";

      panel.insertBefore(link, panel.querySelector(".status-support"));
    }

    link.href = waUrl(order);
  }

  // Панель «Заказ принят»: новый текст + кнопка WhatsApp
  var origShowStatus = window.showOrderStatus;

  window.showOrderStatus = function (order, autoScroll) {
    origShowStatus(order, autoScroll);

    var text = document.getElementById("statusText");
    if (text) {
      text.textContent =
        "Мы отправим реквизиты для оплаты в WhatsApp. " +
        "После подтверждения оплаты приложения станут доступны для установки.";
    }

    ensureWhatsappButton(order);
  };

  /* ---------- 4. Создание заказа ---------- */

  function makeToken() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();

    var bytes = new Uint8Array(24);
    crypto.getRandomValues(bytes);

    return Array.prototype.map.call(bytes, function (x) {
      return ("0" + x.toString(16)).slice(-2);
    }).join("");
  }

  function getToken() {
    try {
      var saved = localStorage.getItem(TOKEN_KEY);
      if (saved && /^[A-Za-z0-9-]{20,64}$/.test(saved)) return saved;
    } catch (e) {}

    return makeToken();
  }

  async function submitOrder() {
    if (busy) return;

    var name = nameField.value.trim();
    var phone = normalizePhone(phoneField.value);

    if (name.length < 2) {
      showToast("Введите ваше имя");
      nameField.focus();
      return;
    }

    if (!isValidPhone(phone)) {
      showToast("Введите корректный номер телефона");
      phoneField.focus();
      return;
    }

    var list = getSafeSelectedApps();

    if (!list) {
      selected.clear();
      render();
      updatePrice();
      showToast("Некорректное количество приложений");
      return;
    }

    var price = calculatePrice(list.length);
    var token = getToken();

    var order = {
      order_number: generateOrderNumber(),
      client_name: name.slice(0, 60),
      client_phone: phone,
      profile_token: token,
      app_ids: list.map(function (a) { return a.id; }),
      apps: list.map(function (a) {
        return { id: a.id, name: a.name, type: a.type };
      }),
      original: Math.round(price.original),
      discount: Math.round(price.discountAmount),
      free_apps: 0,
      total: Math.round(price.total),
      status: "awaiting_review"
    };

    if (!isValidSavedOrder(order)) {
      showToast("Не удалось проверить данные заказа");
      return;
    }

    busy = true;
    button.disabled = true;
    button.textContent = "Оформляем заказ…";

    try {
      var result = await supabaseClient.from("orders").insert([order]);

      if (result.error) {
        console.error(result.error);

        var message = result.error.message || "";

        if (message.indexOf("RATE_LIMIT:") !== -1) {
          showToast("Лимит заказов достигнут. Попробуйте снова через 10 минут.");
        } else {
          showToast("Ошибка Supabase: " + (message || "неизвестная ошибка"));
        }

        return;
      }

      // Привязка к рефереру — как раньше
      try {
        var code =
          localStorage.getItem(REFERRAL_CODE_KEY) ||
          localStorage.getItem("referral_code");

        if (isValidReferralCode(code)) {
          var ref = await supabaseClient.rpc("register_referral", {
            p_referral_code: code.trim(),
            p_referred_user_id: phone
          });

          if (ref.error) {
            console.error("Referral registration error:", ref.error);
          }
        }
      } catch (e) {
        console.error("Referral error:", e);
      }

      currentOrder = order;

      saveOrderLock(order);
      saveClientOrder(order, Date.now());

      try {
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(NAME_KEY, name);
      } catch (e) {}

      closePaymentModal();
      selected.clear();
      render();
      updatePrice();

      showOrderStatus(order, true);
      startStatusChecking();
      updateWhatsAppLinks();

      showToast("Заказ " + order.order_number + " создан");

      // Переход в WhatsApp с готовым текстом
      setTimeout(function () {
        window.location.href = waUrl(order);
      }, 700);

    } catch (error) {
      console.error(error);
      showToast("Ошибка соединения с сервером");

    } finally {
      busy = false;
      button.disabled = false;
      button.textContent = "Оформить заказ";
    }
  }

  button.addEventListener("click", submitOrder);

})();
