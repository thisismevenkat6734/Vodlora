/**
 * VIDLORA - Frontend Security Utilities
 * Static website security helpers.
 *
 * Important:
 * Client-side validation is not server-side security.
 */

"use strict";

(function () {
  const ALLOWED_PROTOCOLS = ["https:", "http:"];

  const BLOCKED_HOSTS = [
    "localhost",
    "127.0.0.1",
    "0.0.0.0",
    "::1"
  ];

  const ALLOWED_EMBED_HOSTS = [
    "www.youtube-nocookie.com",
    "www.instagram.com",
    "www.facebook.com",
    "player.vimeo.com",
    "www.dailymotion.com"
  ];

  function validateUrl(value) {
    if (typeof value !== "string" || !value.trim()) {
      return {
        valid: false,
        reason: "URL is required."
      };
    }

    let url;

    try {
      url = new URL(value.trim());
    } catch {
      return {
        valid: false,
        reason: "Invalid URL."
      };
    }

    if (!ALLOWED_PROTOCOLS.includes(url.protocol)) {
      return {
        valid: false,
        reason: "Only HTTP and HTTPS URLs are permitted."
      };
    }

    if (url.username || url.password) {
      return {
        valid: false,
        reason: "URLs containing credentials are not permitted."
      };
    }

    const hostname = url.hostname.toLowerCase();

    if (
      BLOCKED_HOSTS.includes(hostname) ||
      hostname.endsWith(".localhost") ||
      hostname.endsWith(".local")
    ) {
      return {
        valid: false,
        reason: "This host is not permitted."
      };
    }

    return {
      valid: true,
      url: url.href,
      hostname: hostname
    };
  }

  function validateEmbedUrl(value) {
    const result = validateUrl(value);

    if (!result.valid) {
      return result;
    }

    const url = new URL(result.url);

    if (
      url.protocol !== "https:" ||
      !ALLOWED_EMBED_HOSTS.includes(url.hostname)
    ) {
      return {
        valid: false,
        reason: "This embed domain is not allowed."
      };
    }

    return {
      valid: true,
      url: url.href
    };
  }

  function safeText(value, maxLength) {
    const limit = Number.isInteger(maxLength)
      ? Math.max(0, maxLength)
      : 2000;

    return String(value == null ? "" : value)
      .slice(0, limit);
  }

  function setText(element, value, maxLength) {
    if (!(element instanceof HTMLElement)) {
      throw new Error("A valid HTML element is required.");
    }

    element.textContent = safeText(value, maxLength);
  }

  function clearElement(element) {
    if (!(element instanceof HTMLElement)) {
      return;
    }

    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }
  }

  function createSafeLink(value, label) {
    const result = validateUrl(value);

    if (!result.valid) {
      throw new Error(result.reason);
    }

    const link = document.createElement("a");

    link.href = result.url;
    link.textContent = safeText(label || "Open video source", 100);
    link.target = "_blank";
    link.rel = "noopener noreferrer";

    return link;
  }

  function isSupportedVideoUrl(value) {
    const result = validateUrl(value);

    if (!result.valid) {
      return false;
    }

    const pathname = new URL(result.url).pathname.toLowerCase();

    return pathname.endsWith(".mp4") ||
      pathname.endsWith(".webm");
  }

  window.VidloraSecurity = Object.freeze({
    validateUrl: validateUrl,
    validateEmbedUrl: validateEmbedUrl,
    safeText: safeText,
    setText: setText,
    clearElement: clearElement,
    createSafeLink: createSafeLink,
    isSupportedVideoUrl: isSupportedVideoUrl
  });

})();
