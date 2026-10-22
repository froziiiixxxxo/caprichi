
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
});
