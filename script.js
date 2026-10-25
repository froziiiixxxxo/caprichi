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
