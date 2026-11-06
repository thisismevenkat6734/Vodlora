
/* =========================================
   VIDLORA - APPLICATION SCRIPT
   File: js/app.js
========================================= */

"use strict";


/* =========================================
   DOM READY
========================================= */

document.addEventListener("DOMContentLoaded", () => {

  initializeNavigation();

  initializeCurrentYear();

  initializeClearButton();

  initializeSmoothNavigation();

  initializePWA();

});


/* =========================================
   MOBILE NAVIGATION
========================================= */

function initializeNavigation() {

  const menuToggle = document.getElementById("menuToggle");
  const mainNav = document.getElementById("mainNav");

  if (!menuToggle || !mainNav) {
    return;
  }

  function closeMenu() {

    mainNav.classList.remove("active");

    menuToggle.setAttribute("aria-expanded", "false");

    menuToggle.innerHTML = "☰";

  }

  function toggleMenu() {

    const isOpen = mainNav.classList.toggle("active");

    menuToggle.setAttribute(
      "aria-expanded",
      String(isOpen)
    );

    menuToggle.innerHTML = isOpen ? "✕" : "☰";

  }

  menuToggle.addEventListener("click", toggleMenu);

  mainNav.querySelectorAll("a").forEach(link => {

    link.addEventListener("click", closeMenu);

  });

  document.addEventListener("click", event => {

    const clickedInsideMenu = mainNav.contains(event.target);

    const clickedToggle = menuToggle.contains(event.target);

    if (!clickedInsideMenu && !clickedToggle) {
      closeMenu();
    }

  });

  document.addEventListener("keydown", event => {

    if (event.key === "Escape") {
      closeMenu();
    }

  });

  window.addEventListener("resize", () => {

    if (window.innerWidth > 700) {
      closeMenu();
    }

  });

}


/* =========================================
   CURRENT YEAR
========================================= */

function initializeCurrentYear() {

  const yearElement = document.getElementById("currentYear");

  if (!yearElement) {
    return;
  }

  yearElement.textContent = new Date().getFullYear();

}


/* =========================================
   CLEAR URL INPUT
========================================= */

function initializeClearButton() {

  const clearButton = document.getElementById("clearUrl");

  const videoUrl = document.getElementById("videoUrl");

  const videoResult = document.getElementById("videoResult");

  const downloadStatus = document.getElementById("downloadStatus");

  const videoPreview = document.getElementById("videoPreview");

  if (!clearButton || !videoUrl) {
    return;
  }

  clearButton.addEventListener("click", () => {

    videoUrl.value = "";

    videoUrl.focus();

    if (videoResult) {
      videoResult.hidden = true;
    }

    if (downloadStatus) {
      downloadStatus.hidden = true;
      downloadStatus.textContent = "";
      downloadStatus.className = "status-message";
    }

    if (videoPreview) {
      videoPreview.pause();
      videoPreview.removeAttribute("src");
      videoPreview.load();
    }

  });

}


/* =========================================
   SMOOTH NAVIGATION
========================================= */

function initializeSmoothNavigation() {

  document.querySelectorAll('a[href^="#"]').forEach(link => {

    link.addEventListener("click", event => {

      const targetId = link.getAttribute("href");

      if (!targetId || targetId === "#") {
        return;
      }

      const target = document.querySelector(targetId);

      if (!target) {
        return;
      }

      event.preventDefault();

      target.scrollIntoView({
        behavior: window.matchMedia(
          "(prefers-reduced-motion: reduce)"
        ).matches ? "auto" : "smooth",
        block: "start"
      });

      history.replaceState(null, "", targetId);

    });

  });

}


/* =========================================
   PWA SERVICE WORKER
========================================= */

function initializePWA() {

  if (!("serviceWorker" in navigator)) {
    return;
  }

  if (location.protocol !== "https:" && location.hostname !== "localhost") {
    return;
  }

  window.addEventListener("load", async () => {

    try {

      const registration = await navigator.serviceWorker.register(
        "service-worker.js"
      );

      console.info(
        "VIDLORA service worker registered:",
        registration.scope
      );

    } catch (error) {

      console.error(
        "VIDLORA service worker registration failed:",
        error
      );

    }

  });

}


/* =========================================
   GLOBAL ERROR HANDLING
========================================= */

window.addEventListener("error", event => {

  console.error(
    "VIDLORA application error:",
    event.message
  );

});

window.addEventListener("unhandledrejection", event => {

  console.error(
    "VIDLORA asynchronous error:",
    event.reason
  );

});
