/**
 * VIDLORA - Direct Video Handler
 * Direct MP4/WebM inspection, quality detection and download.
 *
 * Static frontend only.
 * Does not extract platform streams or bypass DRM.
 */

"use strict";

(function () {
  const SUPPORTED_TYPES = {
    mp4: ["video/mp4"],
    webm: ["video/webm"]
  };

  const MAX_INSPECTION_BYTES = 1024 * 1024;

  function validateUrl(input) {
    let url;

    try {
      url = new URL(input);
    } catch {
      throw new Error("Invalid video URL.");
    }

    if (
      url.protocol !== "https:" &&
      url.protocol !== "http:"
    ) {
      throw new Error("Only HTTP and HTTPS URLs are supported.");
    }

    if (url.username || url.password) {
      throw new Error("URLs containing credentials are not supported.");
    }

    return url;
  }

  function getExtension(url) {
    const path = url.pathname.toLowerCase();

    if (path.endsWith(".mp4")) return "mp4";
    if (path.endsWith(".webm")) return "webm";

    return null;
  }

  function normalizeMime(value) {
    return (value || "")
      .split(";")[0]
      .trim()
      .toLowerCase();
  }

  function getQualityLabel(height) {
    if (!height || height <= 0) return "Unknown";

    if (height >= 2160) return "2160p - 4K";
    if (height >= 1440) return "1440p - 2K";
    if (height >= 1080) return "1080p - Full HD";
    if (height >= 720) return "720p - HD";
    if (height >= 480) return "480p - SD";
    if (height >= 360) return "360p";
    if (height >= 240) return "240p";

    return "144p / Low resolution";
  }

  async function inspect(input) {
    const url = validateUrl(input);
    const extension = getExtension(url);

    if (!extension) {
      throw new Error("Only direct MP4 and WebM URLs are supported.");
    }

    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      15000
    );

    try {
      const response = await fetch(url.href, {
        method: "GET",
        headers: {
          Range: "bytes=0-0"
        },
        mode: "cors",
        credentials: "omit",
        cache: "no-store",
        redirect: "follow",
        signal: controller.signal
      });

      if (!response.ok && response.status !== 206) {
        throw new Error(
          "The video source returned HTTP " + response.status + "."
        );
      }

      const mime = normalizeMime(
        response.headers.get("content-type")
      );

      const allowedTypes = SUPPORTED_TYPES[extension];

      if (!allowedTypes.includes(mime)) {
        throw new Error(
          "The source did not confirm a supported video MIME type."
        );
      }

      const rangeSupported =
        response.status === 206 ||
        response.headers.get("accept-ranges") === "bytes";

      const contentLength = Number(
        response.headers.get("content-length")
      );

      if (response.body) {
        try {
          await response.body.cancel();
        } catch {
          // Response body cancellation is best-effort.
        }
      }

      return {
        valid: true,
        url: url.href,
        format: extension,
        mimeType: mime,
        rangeSupported: rangeSupported,
        contentLength: Number.isFinite(contentLength)
          ? contentLength
          : null,
        quality: null,
        qualityOptions: [],
        qualityKnown: false,
        message:
          "Video source verified. Resolution and alternate qualities have not yet been established."
      };
    } catch (error) {
      if (error.name === "AbortError") {
        throw new Error("Video source check timed out.");
      }

      if (
        error instanceof TypeError ||
        /CORS|fetch/i.test(error.message)
      ) {
        throw new Error(
          "The source server may block browser access (CORS). VIDLORA cannot inspect this URL."
        );
      }

      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  async function detectQuality(input) {
    const url = validateUrl(input);

    return new Promise(function (resolve, reject) {
      const video = document.createElement("video");

      video.preload = "metadata";
      video.muted = true;
      video.playsInline = true;

      let completed = false;

      const timeout = setTimeout(function () {
        finish(new Error("Video metadata check timed out."));
      }, 15000);

      function finish(error) {
        if (completed) return;

        completed = true;
        clearTimeout(timeout);

        video.removeAttribute("src");
        video.load();

        if (error) {
          reject(error);
          return;
        }

        const height = video.videoHeight || 0;
        const width = video.videoWidth || 0;

        resolve({
          width: width,
          height: height,
          quality: getQualityLabel(height),
          qualityOptions: height
            ? [{
                label: getQualityLabel(height),
                height: height,
                url: url.href
              }]
            : [],
          qualityKnown: Boolean(height),
          message: height
            ? "The source exposes one playable video resolution."
            : "Video resolution is not available."
        });
      }

      video.addEventListener("loadedmetadata", function () {
        finish(null);
      }, { once: true });

      video.addEventListener("error", function () {
        finish(
          new Error(
            "Could not read video metadata. The source may block playback."
          )
        );
      }, { once: true });

      video.src = url.href;
      video.load();
    });
  }

  async function download(input, filename) {
    const url = validateUrl(input);
    const extension = getExtension(url);

    if (!extension) {
      throw new Error("Only MP4 and WebM downloads are supported.");
    }

    const safeName = String(
      filename || "vidlora-video"
    ).replace(/[^a-zA-Z0-9_-]/g, "_");

    const anchor = document.createElement("a");

    anchor.href = url.href;
    anchor.download = safeName + "." + extension;
    anchor.rel = "noopener noreferrer";

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    return {
      started: true,
      guaranteed: false,
      message:
        "Download requested. Browser and source-server policies may open the video instead of saving it."
    };
  }

  window.VidloraDirectVideo = Object.freeze({
    inspect: inspect,
    detectQuality: detectQuality,
    download: download,
    getQualityLabel: getQualityLabel
  });

})();
