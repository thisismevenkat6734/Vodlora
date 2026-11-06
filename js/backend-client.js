"use strict";

(function () {
  const API_BASE_URL = (
    window.VIDLORA_CONFIG &&
    window.VIDLORA_CONFIG.API_BASE_URL
  )
    ? window.VIDLORA_CONFIG.API_BASE_URL
    : "";

  function getApiUrl(endpoint) {
    if (!API_BASE_URL) {
      throw new Error(
        "VIDLORA backend is not configured. Deploy the backend and set its URL."
      );
    }

    const base = API_BASE_URL.replace(/\/+$/, "");

    return `${base}/api/${endpoint}`;
  }

  async function request(endpoint, options = {}) {
    const response = await fetch(getApiUrl(endpoint), {
      method: options.method || "GET",
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {})
      },
      body: options.body
        ? JSON.stringify(options.body)
        : undefined,
      mode: "cors",
      credentials: "omit",
      cache: "no-store",
      redirect: "error"
    });

    let data;

    try {
      data = await response.json();
    } catch {
      throw new Error("Backend returned an invalid response.");
    }

    if (!response.ok || data.success === false) {
      throw new Error(
        data.message || data.error || "Backend request failed."
      );
    }

    return data;
  }

  async function health() {
    return request("health");
  }

  async function detect(url) {
    if (typeof url !== "string" || !url.trim()) {
      throw new Error("Please enter a video URL.");
    }

    return request("detect", {
      method: "POST",
      body: {
        url: url.trim()
      }
    });
  }

  window.VidloraBackend = Object.freeze({
    health,
    detect,
    isConfigured: () => Boolean(API_BASE_URL)
  });
})();
