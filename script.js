"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const menuToggle = document.querySelector(".menu-toggle");
  const navigation = document.querySelector(".navigation");
  const navigationLinks = document.querySelectorAll(".navigation a");
  const currentYear = document.querySelector("#current-year");

  // Автоматически обновляем год в подвале.
  if (currentYear) {
    currentYear.textContent = new Date().getFullYear();
  }

  // Открытие и закрытие мобильной навигации.
  if (menuToggle && navigation) {
    const setMenuState = (isOpen) => {
      menuToggle.setAttribute("aria-expanded", String(isOpen));
      menuToggle.setAttribute(
        "aria-label",
        isOpen ? "Закрыть меню" : "Открыть меню"
      );

      navigation.classList.toggle("is-open", isOpen);
      document.body.classList.toggle("menu-open", isOpen);
    };

    menuToggle.addEventListener("click", () => {
      const isOpen =
        menuToggle.getAttribute("aria-expanded") === "true";

      setMenuState(!isOpen);
    });

    // Закрываем меню при переходе к разделу.
    navigationLinks.forEach((link) => {
      link.addEventListener("click", () => {
        setMenuState(false);
      });
    });

    // Закрываем меню клавишей Escape.
    document.addEventListener("keydown", (event) => {
      if (
        event.key === "Escape" &&
        menuToggle.getAttribute("aria-expanded") === "true"
      ) {
        setMenuState(false);
        menuToggle.focus();
      }
    });

    // Если экран стал шире мобильного брейкпоинта,
    // сбрасываем состояние мобильного меню.
    window.addEventListener("resize", () => {
      if (window.innerWidth > 680) {
        setMenuState(false);
      }
    });
  }

  // Модальное окно заявки.
  const modal = document.getElementById("applicationModal");
  if (modal) {
    const openButtons = document.querySelectorAll(".open-modal-btn");
    const closeButtons = modal.querySelectorAll("[data-modal-close]");
    const form = document.getElementById("applicationForm");
    const nameInput = document.getElementById("applicationName");
    const message = document.getElementById("applicationFormMessage");
    let previousFocus = null;

    const openModal = (event) => {
      if (event) event.preventDefault();
      previousFocus = document.activeElement;
      modal.classList.add("is-open");
      modal.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      window.requestAnimationFrame(() => nameInput && nameInput.focus());
    };

    const closeModal = () => {
      if (!modal.classList.contains("is-open")) return;
      modal.classList.remove("is-open");
      modal.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      if (message) message.textContent = "";
      if (previousFocus && typeof previousFocus.focus === "function") previousFocus.focus();
    };

    openButtons.forEach((button) => button.addEventListener("click", openModal));
    closeButtons.forEach((button) => button.addEventListener("click", closeModal));
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && modal.classList.contains("is-open")) closeModal();
    });

    // ОТПРАВКА ФОРМЫ В TELEGRAM
    if (form) {
      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        if (!form.reportValidity()) return;

        if (message) message.textContent = "Отправляем...";
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.disabled = true;

        try {
          const formData = new FormData(form);
          
          // ВАЖНО: ЗАМЕНИ ЭТУ ССЫЛКУ НА СВОЮ ССЫЛКУ ИЗ CLOUDFLARE
          const response = await fetch('https://caprichi.pogreckijanton9.workers.dev/', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) throw new Error('Ошибка сети');

          if (message) message.textContent = "Спасибо! Заявка отправлена. Мы скоро свяжемся с вами.";
          form.reset();
        } catch (error) {
          if (message) message.textContent = "Ошибка отправки. Попробуйте еще раз или позвоните нам.";
          console.error(error);
        } finally {
          if (submitBtn) submitBtn.disabled = false;
        }
      });
    }
  }
});

/* ==========================================================
   КОРЗИНА-КАЛЬКУЛЯТОР (menu.html)
   На страницах без разметки корзины код не запускается.
   ========================================================== */
document.addEventListener("DOMContentLoaded", () => {
  // Тот же воркер, что и для формы заявки
  const CART_ENDPOINT = "https://caprichi.pogreckijanton9.workers.dev/";
  const STORAGE_KEY = "capricci-cart-v1";

  const fab = document.getElementById("cartFab");
  const modal = document.getElementById("cartModal");
  if (!fab || !modal) return; // корзина есть только там, где добавлен её HTML

  const fabCount = document.getElementById("cartFabCount");
  const itemsList = document.getElementById("cartItems");
  const emptyNote = document.getElementById("cartEmpty");
  const totalSumEl = document.getElementById("cartTotalSum");
  const form = document.getElementById("cartForm");
  const nameInput = document.getElementById("cartName");
  const phoneInput = document.getElementById("cartPhone");
  const addressInput = document.getElementById("cartAddress");
  const submitBtn = document.getElementById("cartSubmit");
  const messageEl = document.getElementById("cartFormMessage");
  const closeButtons = modal.querySelectorAll("[data-cart-close]");

  /* ---------- 1. Товары из карточек + кнопка «+ В корзину» ---------- */

  const products = {}; // имя -> { name, price, buttons: [] }

  document.querySelectorAll(".pizza-card").forEach((card) => {
    const info = card.querySelector(".pizza-info");
    const titleEl = card.querySelector(".pizza-title-row h3");
    const priceEl = card.querySelector(".pizza-price");
    if (!info || !titleEl || !priceEl) return;

    const name = titleEl.textContent.trim();

    // Берём первую цену из текста. У позиций с двумя ценами
    // («Капучино — 160 ₽ / 180 ₽») посчитается первая — 160 ₽.
    const priceMatch = priceEl.textContent
      .replace(/\u00a0/g, " ")
      .match(/\d[\d\s]*/);
    if (!name || !priceMatch) return;

    const price = parseInt(priceMatch[0].replace(/\s/g, ""), 10);
    if (!Number.isFinite(price)) return;

    if (!products[name]) products[name] = { name, price, buttons: [] };

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "pizza-add-btn";
    btn.setAttribute("aria-label", `Добавить «${name}» в корзину`);
    btn.addEventListener("click", () => addToCart(name));
    info.appendChild(btn);

    products[name].buttons.push(btn);
  });

  if (Object.keys(products).length === 0) return;

  /* ---------- 2. Состояние корзины (сохраняется в localStorage) ---------- */

  let cart = {}; // имя товара -> количество

  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && typeof saved === "object") {
      Object.keys(saved).forEach((key) => {
        const qty = Number(saved[key]);
        if (products[key] && Number.isFinite(qty) && qty > 0) {
          cart[key] = Math.floor(qty);
        }
      });
    }
  } catch (error) {
    cart = {};
  }

  const saveCart = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    } catch (error) {
      /* localStorage недоступен — корзина просто не переживёт перезагрузку */
    }
  };

  const cartCount = () =>
    Object.keys(cart).reduce((sum, key) => sum + cart[key], 0);

  const cartTotal = () =>
    Object.keys(cart).reduce(
      (sum, key) => sum + cart[key] * products[key].price,
      0
    );

  const formatMoney = (value) => `${value.toLocaleString("ru-RU")} ₽`;

  /* ---------- 3. Действия ---------- */

  function addToCart(name) {
    cart[name] = (cart[name] || 0) + 1;
    saveCart();
    render();
  }

  function changeQty(name, delta) {
    const next = (cart[name] || 0) + delta;
    if (next <= 0) {
      delete cart[name];
    } else {
      cart[name] = next;
    }
    saveCart();
    render();
  }

  function removeItem(name) {
    delete cart[name];
    saveCart();
    render();
  }

  /* ---------- 4. Отрисовка ---------- */

  function render() {
    const count = cartCount();

    // Счётчик на плавающей кнопке
    if (fabCount) {
      fabCount.textContent = String(count);
      fabCount.classList.toggle("is-hidden", count === 0);
    }

    // Кнопки на карточках
    Object.keys(products).forEach((key) => {
      const qty = cart[key] || 0;
      products[key].buttons.forEach((btn) => {
        btn.classList.toggle("is-in-cart", qty > 0);
        btn.textContent = qty > 0 ? `В корзине (${qty})` : "+ В корзину";
      });
    });

    // Список товаров в корзине
    itemsList.innerHTML = "";
    Object.keys(cart).forEach((key) => {
      const product = products[key];
      const qty = cart[key];

      const li = document.createElement("li");
      li.className = "cart-item";
      li.dataset.name = key;

      const info = document.createElement("div");
      info.className = "cart-item__info";

      const nameEl = document.createElement("span");
      nameEl.className = "cart-item__name";
      nameEl.textContent = product.name;

      const unitEl = document.createElement("span");
      unitEl.className = "cart-item__unit";
      unitEl.textContent = `${formatMoney(product.price)} / шт.`;

      info.append(nameEl, unitEl);

      const controls = document.createElement("div");
      controls.className = "cart-item__controls";

      const minusBtn = document.createElement("button");
      minusBtn.type = "button";
      minusBtn.className = "cart-item__btn";
      minusBtn.dataset.action = "decrease";
      minusBtn.setAttribute("aria-label", "Уменьшить количество");
      minusBtn.textContent = "−";

      const qtyEl = document.createElement("span");
      qtyEl.className = "cart-item__qty";
      qtyEl.textContent = String(qty);

      const plusBtn = document.createElement("button");
      plusBtn.type = "button";
      plusBtn.className = "cart-item__btn";
      plusBtn.dataset.action = "increase";
      plusBtn.setAttribute("aria-label", "Увеличить количество");
      plusBtn.textContent = "+";

      controls.append(minusBtn, qtyEl, plusBtn);

      const sumEl = document.createElement("span");
      sumEl.className = "cart-item__sum";
      sumEl.textContent = formatMoney(product.price * qty);

      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "cart-item__remove";
      removeBtn.dataset.action = "remove";
      removeBtn.setAttribute("aria-label", `Удалить «${product.name}»`);
      removeBtn.textContent = "×";

      li.append(info, controls, sumEl, removeBtn);
      itemsList.appendChild(li);
    });

    if (emptyNote) emptyNote.classList.toggle("is-hidden", count > 0);
    if (totalSumEl) totalSumEl.textContent = formatMoney(cartTotal());
    if (submitBtn) submitBtn.disabled = count === 0;
  }

  // Кнопки +/−/× внутри списка (делегирование событий)
  itemsList.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    const row = button.closest(".cart-item");
    if (!row || !row.dataset.name) return;

    if (button.dataset.action === "increase") changeQty(row.dataset.name, 1);
    if (button.dataset.action === "decrease") changeQty(row.dataset.name, -1);
    if (button.dataset.action === "remove") removeItem(row.dataset.name);
  });

  /* ---------- 5. Открытие / закрытие корзины ---------- */

  let previousFocus = null;
  let closeTimer = null;

  const isCartOpen = () => modal.classList.contains("is-open");

  function openCart() {
    if (closeTimer) {
      window.clearTimeout(closeTimer);
      closeTimer = null;
    }
    previousFocus = document.activeElement;
    render();
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("cart-open");

    window.requestAnimationFrame(() => {
      const closeBtn = modal.querySelector(".cart-modal__close");
      if (closeBtn) closeBtn.focus();
    });
  }

  function closeCart() {
    if (!isCartOpen()) return;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("cart-open");
    if (messageEl) messageEl.textContent = "";
    if (previousFocus && typeof previousFocus.focus === "function") {
      previousFocus.focus();
    }
  }

  fab.addEventListener("click", openCart);
  closeButtons.forEach((btn) => btn.addEventListener("click", closeCart));

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && isCartOpen()) closeCart();
  });

    /* ---------- 6. Оформление заказа ---------- */

  // Пока пользователь исправляет адрес — убираем подсветку и ошибку
  if (addressInput) {
    addressInput.addEventListener("input", () => {
      addressInput.classList.remove("is-invalid");
      if (
        messageEl &&
        messageEl.textContent === "Укажите улицу, дом и квартиру"
      ) {
        messageEl.textContent = "";
      }
    });
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    // Корзина пуста — отправлять нечего
    if (cartCount() === 0) {
      if (messageEl) {
        messageEl.textContent = "Корзина пуста — сначала добавьте блюда из меню.";
      }
      return;
    }

    // Нативная проверка обязательных полей (включая select оплаты)
    if (typeof form.reportValidity === "function" && !form.reportValidity()) {
      return;
    }

    const name = nameInput ? nameInput.value.trim() : "";
    const phone = phoneInput ? phoneInput.value.trim() : "";
    const address = addressInput ? addressInput.value.trim() : "";
    
        // ПРОВЕРКА ТЕЛЕФОНА (от 10 до 12 цифр)
    if (phoneInput) phoneInput.classList.remove("is-invalid");

    const phoneDigits = phone.replace(/\D/g, "");
    if (phoneDigits.length < 10 || phoneDigits.length > 12) {
      if (phoneInput) {
        phoneInput.classList.add("is-invalid");
        phoneInput.focus();
      }
      if (messageEl) {
        messageEl.textContent = "Пожалуйста, введите корректный номер телефона";
      }
      return;
    }

    const paymentSelect = document.getElementById("cartPayment");
    const payment = paymentSelect ? paymentSelect.value.trim() : "";

    // Страховка: способ оплаты обязателен
    if (!payment) {
      if (messageEl) messageEl.textContent = "Выберите способ оплаты";
      if (paymentSelect) paymentSelect.focus();
      return;
    }

    // Проверка адреса: минимум 5 символов и наличие запятой
    const isAddressValid = address.length >= 5 && address.includes(",");

    if (!isAddressValid) {
      if (addressInput) {
        addressInput.classList.add("is-invalid");
        addressInput.focus();
      }
      if (messageEl) messageEl.textContent = "Укажите улицу, дом и квартиру";
      return; // форму не отправляем
    }

    if (addressInput) addressInput.classList.remove("is-invalid");

    // Окно подтверждения данных
    const confirmText =
      "Проверьте ваши данные:\n" +
      `Имя: ${name}\n` +
      `Телефон: ${phone}\n` +
      `Адрес: ${address}\n` +
      `Оплата: ${payment}\n\n` +
      "Всё верно?";

    if (!window.confirm(confirmText)) {
      // «Отмена» — отправку останавливаем, кнопка возвращается в активное состояние
      if (submitBtn) submitBtn.disabled = false;
      if (messageEl) {
        messageEl.textContent =
          "Отправка отменена. Исправьте данные при необходимости и нажмите «Оформить заказ» ещё раз.";
      }
      return;
    }

    // Список товаров из корзины
    const lines = Object.keys(cart).map((key) => {
      const product = products[key];
      const qty = cart[key];
      return `• ${product.name} — ${qty} шт. × ${formatMoney(product.price)} = ${formatMoney(product.price * qty)}`;
    });

    // Полный текст заказа для поля message
    const orderText = [
      "НОВЫЙ ЗАКАЗ — ПИЦЦЕРИЯ «КАПРИЧЧИ»",
      "",
      ...lines,
      "",
      `ИТОГО: ${formatMoney(cartTotal())}`,
      "",
      `Имя: ${name}`,
      `Телефон: ${phone}`,
      `Адрес доставки: ${address}`,
      `Оплата: ${payment}`,
    ].join("\n");

    const data = new FormData();
    data.append("name", name);
    data.append("phone", phone);
    data.append("address", address);
    data.append("payment", payment);
    data.append("message", orderText);
    data.append("total", String(cartTotal()));

    if (submitBtn) submitBtn.disabled = true;
    if (messageEl) messageEl.textContent = "Отправляем заказ...";

    try {
      const response = await fetch(CART_ENDPOINT, {
        method: "POST",
        body: data,
      });

      if (!response.ok) throw new Error(`Ошибка сети: ${response.status}`);

      if (messageEl) {
        messageEl.textContent =
          "Спасибо! Заказ отправлен. Мы свяжемся с вами для подтверждения";
      }

      cart = {};
      saveCart();
      render();
      form.reset();

      closeTimer = window.setTimeout(closeCart, 4000);
    } catch (error) {
      if (messageEl) {
        messageEl.textContent =
          "Ошибка отправки. Попробуйте ещё раз или позвоните нам: +7 (902) 004-08-28";
      }
      console.error(error);
    } finally {
      if (submitBtn) submitBtn.disabled = cartCount() === 0;
    }
  });

  /* ---------- 7. Первичная отрисовка (восстановление корзины) ---------- */
  render();
});