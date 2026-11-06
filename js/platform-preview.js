/**
 * VIDLORA - Platform Preview
 * Official platform embeds and download availability UI.
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

  const LABELS = {
    youtube: "YouTube",
    instagram: "Instagram",
    facebook: "Facebook",
    vimeo: "Vimeo",
    dailymotion: "Dailymotion"
  };

  function element(tag, className) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    return el;
  }

  function clear(container) {
    container.replaceChildren();
  }

  function validateEmbed(result) {
    const allowed = ALLOWED_EMBED_HOSTS[result.platform];

    if (!allowed || !result.embedUrl) {
      throw new Error("Unsupported embed.");
    }

    const url = new URL(result.embedUrl);

    if (
      url.protocol !== "https:" ||
      !allowed.includes(url.hostname)
    ) {
      throw new Error("Untrusted embed URL.");
    }

    return url;
  }

  function showMessage(container, message) {
    const box = element("div", "vidlora-preview-message");
    box.setAttribute("role", "status");
    box.textContent = message;
    container.appendChild(box);
  }

  function renderPlatform(result, container) {
    const url = validateEmbed(result);

    const wrapper = element("div", "vidlora-preview-frame");

    const title = element("h3", "vidlora-preview-title");
    title.textContent = (LABELS[result.platform] || "Video") + " Preview";

    const iframe = element("iframe", "vidlora-preview-iframe");

    iframe.src = url.href;
    iframe.title = title.textContent;
    iframe.loading = "lazy";
    iframe.referrerPolicy = "strict-origin-when-cross-origin";
    iframe.allowFullscreen = true;
    iframe.allow =
      "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";

    iframe.setAttribute(
      "sandbox",
      "allow-scripts allow-same-origin allow-presentation allow-popups"
    );

    wrapper.append(title, iframe);
    container.appendChild(wrapper);

    const downloadInfo = element("div", "vidlora-platform-download");

    const heading = element("h4");
    heading.textContent = "Download Availability";

    const message = element("p");
    message.textContent =
      "This platform preview does not provide a direct downloadable video file. VIDLORA cannot download this embedded video.";

    const disabledButton = element(
      "button",
      "download-button result-download"
    );

    disabledButton.type = "button";
    disabledButton.disabled = true;
    disabledButton.textContent = "Download Not Available";

    const sourceLink = element("a", "primary-button");
    sourceLink.href = result.originalUrl;
    sourceLink.target = "_blank";
    sourceLink.rel = "noopener noreferrer";
    sourceLink.textContent = "Open Original Video ↗";

    downloadInfo.append(
      heading,
      message,
      disabledButton,
      sourceLink
    );

    container.appendChild(downloadInfo);
  }

  function showDirectVideo(result, container) {
    const wrapper = element("div", "vidlora-direct-preview");

    const title = element("h3", "vidlora-preview-title");
    title.textContent = "Direct Video Preview";

    const video = element("video", "vidlora-video-player");
    video.controls = true;
    video.preload = "metadata";
    video.playsInline = true;

    const source = document.createElement("source");
    source.src = result.originalUrl;
    source.type = result.format === "mp4"
      ? "video/mp4"
      : "video/webm";

    video.appendChild(source);
    wrapper.append(title, video);
    container.appendChild(wrapper);
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
          : "Preview is unavailable."
      );
      return false;
    }

    try {
      if (result.platform === "direct") {
        showDirectVideo(result, container);
      } else {
        renderPlatform(result, container);
      }

      return true;
    } catch (error) {
      showMessage(container, error.message);
      return false;
    }
  }

  window.VidloraPlatformPreview = Object.freeze({
    render: render,
    clear: clear
  });

})();
