"use strict";

(function () {
  const API_BASE_URL = "https://vidlora.vercel.app/api";

  async function request(endpoint, url) {
    if (typeof url !== "string" || !url.trim()) {
      throw new Error("Please enter a valid video URL.");
    }

    let response;

    try {
      response = await fetch(`${API_BASE_URL}/${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          url: url.trim()
        }),
        mode: "cors",
        credentials: "omit",
        cache: "no-store"
      });
    } catch {
      throw new Error(
        "Cannot connect to VIDLORA backend. Please try again."
      );
    }

    let data;

    try {
      data = await response.json();
    } catch {
      throw new Error("Invalid response received from backend.");
    }

    if (!response.ok || data.success !== true) {
      throw new Error(
        data.message ||
        data.error ||
        "Backend request failed."
      );
    }

    return data;
  }

  async function health() {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: "GET",
      mode: "cors",
      credentials: "omit",
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error("Backend health check failed.");
    }

    const data = await response.json();

    if (data.success !== true) {
      throw new Error("Backend is not available.");
    }

    return data;
  }

  async function detect(url) {
    return request("detect", url);
  }

  async function inspect(url) {
    return request("inspect", url);
  }

  window.VidloraBackend = Object.freeze({
    health,
    detect,
    inspect,
    isConfigured: true
  });
})();
