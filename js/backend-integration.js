"use strict";

document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("downloadForm");
  const input = document.getElementById("videoUrl");
  const status = document.getElementById("downloadStatus");

  if (!form || !input || !status || !window.VidloraBackend) {
    return;
  }

  let requestNumber = 0;

  async function inspectWithBackend(url, currentRequest) {
    try {
      const detected = await window.VidloraBackend.detect(url);

      if (currentRequest !== requestNumber) return;

      if (detected.type === "direct-video") {
        const inspected = await window.VidloraBackend.inspect(url);

        if (currentRequest !== requestNumber) return;

        if (inspected.success) {
          status.textContent =
            "Backend verified the direct-video URL format. " +
            "Actual file availability and download permission are not verified.";
        }

        return;
      }

      if (detected.type === "platform") {
        status.textContent =
          detected.platform +
          " detected. Preview depends on the platform. " +
          "Platform detection does not provide a download.";
      }
    } catch (error) {
      if (currentRequest !== requestNumber) return;

      status.textContent =
        "Backend check unavailable: " +
        (error.message || "Please try again.");
    }
  }

  form.addEventListener("submit", function () {
    requestNumber += 1;

    const currentRequest = requestNumber;
    const url = input.value.trim();

    if (!url) return;

    inspectWithBackend(url, currentRequest);
  }, true);
});
