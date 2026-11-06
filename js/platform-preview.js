
/**
 * VIDLORA - Platform Preview
 * Creates official platform embeds for supported video URLs.
 *
 * No video extraction.
 * No DRM bypass.
 * No third-party downloader services.
 */

"use strict";

(function () {
  const ALLOWED_EMBED_HOSTS = {
    youtube: ["www.youtube-nocookie.com"],
    instagram: ["www.instagram.com"],
    facebook: ["www.facebook.com"],
    vimeo: ["player.vimeo.com"],
    dailymotion: ["www.dailymotion.com"]
  };

  const PLATFORM_LABELS = {
    youtube: "YouTube",
    instagram: "Instagram",
    facebook: "Facebook",
    vimeo: "Vimeo",
    dailymotion: "Dailymotion"
  };

  function createElement(tag, className) {
    const element = document.createElement(tag);

    if (className) {
      element.className = className;
    }

    return element;
  }

  function clear(container) {
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
  }

  function validateEmbedUrl(result) {
    if (!result || !result.embedUrl || !result.platform) {
      throw new Error("No supported embed URL was provided.");
    }

    const allowedHosts = ALLOWED_EMBED_HOSTS[result.platform];

    if (!allowedHosts) {
      throw new Error("This platform does not support embeds here.");
    }

    let url;

    try {
      url = new URL(result.embedUrl);
    } catch {
      throw new Error("Invalid embed URL.");
    }

    if (
      url.protocol !== "https:" ||
      !allowedHosts.includes(url.hostname)
    ) {
      throw new Error("The embed URL is not allowed.");
    }

    return url;
  }

  function render(result, container) {
    if (!(container instanceof HTMLElement)) {
      throw new Error("A valid preview container is required.");
    }

    clear(container);

    if (!result || !result.valid || !result.previewSupported) {
      showMessage(
        container,
        result && result.message
          ? result.message
          : "Preview is not available for this link."
      );

      return false;
    }

    if (result.platform === "direct") {
      showDirectVideo(result, container);
      return true;
    }

    let embedUrl;

    try {
      embedUrl = validateEmbedUrl(result);
    } catch (error) {
      showMessage(container, error.message);
      return false;
    }

    const wrapper = createElement("div", "vidlora-preview-frame");

    const title = createElement("h3", "vidlora-preview-title");
    title.textContent =
      (PLATFORM_LABELS[result.platform] || "Video") +
      " Preview";

    const iframe = createElement("iframe", "vidlora-preview-iframe");

    iframe.src = embedUrl.href;
    iframe.title = title.textContent;
    iframe.loading = "lazy";
    iframe.referrerPolicy = "strict-origin-when-cross-origin";
    iframe.allowFullscreen = true;
    iframe.allow =
      "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";

    iframe.setAttribute("sandbox", "allow-scripts allow-same-origin allow-presentation allow-popups");

    wrapper.appendChild(title);
    wrapper.appendChild(iframe);

    container.appendChild(wrapper);

    return true;
  }

  function showDirectVideo(result, container) {
    const wrapper = createElement("div", "vidlora-direct-preview");

    const video = createElement("video", "vidlora-video-player");

    video.controls = true;
    video.preload = "metadata";
    video.playsInline = true;
    video.crossOrigin = "anonymous";

    const source = document.createElement("source");
    source.src = result.originalUrl;

    source.type = result.format === "mp4"
      ? "video/mp4"
      : "video/webm";

    video.appendChild(source);

    const fallback = document.createElement("p");
    fallback.textContent =
      "Your browser could not play this video. The source server may restrict playback.";

    video.appendChild(fallback);

    const title = createElement("h3", "vidlora-preview-title");
    title.textContent = "Video Preview";

    wrapper.appendChild(title);
    wrapper.appendChild(video);

    container.appendChild(wrapper);
  }

  function showMessage(container, message) {
    const box = createElement("div", "vidlora-preview-message");
    box.setAttribute("role", "status");
    box.textContent = message;

    container.appendChild(box);
  }

  window.VidloraPlatformPreview = Object.freeze({
    render: render,
    clear: clear
  });

})();
