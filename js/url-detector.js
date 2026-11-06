/**
 * VIDLORA - URL Detector
 * Detects supported video platforms and direct media URLs.
 *
 * Static frontend only.
 * Does not extract protected media or bypass platform restrictions.
 */

"use strict";

(function () {
  const PLATFORM_HOSTS = {
    youtube: [
      "youtube.com",
      "www.youtube.com",
      "m.youtube.com",
      "youtu.be"
    ],
    instagram: [
      "instagram.com",
      "www.instagram.com"
    ],
    facebook: [
      "facebook.com",
      "www.facebook.com",
      "m.facebook.com",
      "fb.watch"
    ],
    vimeo: [
      "vimeo.com",
      "www.vimeo.com",
      "player.vimeo.com"
    ],
    dailymotion: [
      "dailymotion.com",
      "www.dailymotion.com",
      "dai.ly"
    ]
  };

  const DIRECT_VIDEO_EXTENSIONS = [
    ".mp4",
    ".webm"
  ];

  const BLOCKED_HOSTS = [
    "localhost",
    "127.0.0.1",
    "0.0.0.0"
  ];

  function normalizeUrl(input) {
    if (typeof input !== "string" || !input.trim()) {
      throw new Error("Please enter a video URL.");
    }

    let value = input.trim();

    if (!/^https?:\/\//i.test(value)) {
      value = "https://" + value;
    }

    let parsed;

    try {
      parsed = new URL(value);
    } catch {
      throw new Error("Invalid URL. Please enter a valid video link.");
    }

    if (!["http:", "https:"].includes(parsed.protocol)) {
      throw new Error("Only HTTP and HTTPS links are supported.");
    }

    if (parsed.username || parsed.password) {
      throw new Error("URLs containing embedded credentials are not allowed.");
    }

    const hostname = parsed.hostname.toLowerCase();

    if (
      BLOCKED_HOSTS.includes(hostname) ||
      hostname.endsWith(".localhost") ||
      hostname.endsWith(".local")
    ) {
      throw new Error("This URL host is not supported.");
    }

    return parsed;
  }

  function matchesHost(hostname, allowedHosts) {
    return allowedHosts.some(function (host) {
      return hostname === host || hostname.endsWith("." + host);
    });
  }

  function getDirectFormat(pathname) {
    const path = pathname.toLowerCase();

    return DIRECT_VIDEO_EXTENSIONS.find(function (extension) {
      return path.endsWith(extension);
    }) || null;
  }

  function detectPlatform(hostname) {
    for (const [platform, hosts] of Object.entries(PLATFORM_HOSTS)) {
      if (matchesHost(hostname, hosts)) {
        return platform;
      }
    }

    return "unknown";
  }

  function getYouTubeId(url) {
    const host = url.hostname.toLowerCase();

    if (host === "youtu.be" || host.endsWith(".youtu.be")) {
      return url.pathname.split("/").filter(Boolean)[0] || null;
    }

    if (host.endsWith("youtube.com")) {
      if (url.pathname === "/watch") {
        return url.searchParams.get("v");
      }

      const parts = url.pathname.split("/").filter(Boolean);

      if (
        ["embed", "shorts", "live"].includes(parts[0])
      ) {
        return parts[1] || null;
      }
    }

    return null;
  }

  function getInstagramType(url) {
    const parts = url.pathname.split("/").filter(Boolean);
    const type = parts[0];

    if (["reel", "reels", "p", "tv"].includes(type)) {
      return {
        type: type,
        id: parts[1] || null
      };
    }

    return null;
  }

  function getFacebookType(url) {
    const path = url.pathname.toLowerCase();

    if (path.includes("/reel/")) return "reel";
    if (path.includes("/watch")) return "watch";
    if (path.includes("/videos/")) return "video";

    return "unknown";
  }

  function detect(input) {
    const url = normalizeUrl(input);
    const hostname = url.hostname.toLowerCase();
    const format = getDirectFormat(url.pathname);
    const platform = detectPlatform(hostname);

    if (format) {
      return {
        valid: true,
        platform: "direct",
        type: "direct-video",
        format: format.slice(1),
        originalUrl: url.href,
        previewSupported: true,
        downloadSupported: true,
        qualitySelection: false,
        message: "Direct video link detected. Actual playback and download depend on the source server."
      };
    }

    if (platform === "youtube") {
      const videoId = getYouTubeId(url);

      return {
        valid: Boolean(videoId),
        platform: "youtube",
        type: "platform-video",
        videoId: videoId,
        originalUrl: url.href,
        previewSupported: Boolean(videoId),
        downloadSupported: false,
        qualitySelection: false,
        embedUrl: videoId
          ? "https://www.youtube-nocookie.com/embed/" +
            encodeURIComponent(videoId)
          : null,
        message: videoId
          ? "YouTube video detected. Official embed preview only."
          : "Unable to identify a supported YouTube video."
      };
    }

    if (platform === "instagram") {
      const media = getInstagramType(url);

      return {
        valid: Boolean(media && media.id),
        platform: "instagram",
        type: "platform-video",
        mediaType: media ? media.type : null,
        mediaId: media ? media.id : null,
        originalUrl: url.href,
        previewSupported: Boolean(media && media.id),
        downloadSupported: false,
        qualitySelection: false,
        embedUrl: media && media.id
          ? "https://www.instagram.com/" +
            media.type + "/" +
            encodeURIComponent(media.id) + "/embed"
          : null,
        message: "Instagram public embed may work. Download extraction is not supported."
      };
    }

    if (platform === "facebook") {
      const mediaType = getFacebookType(url);

      return {
        valid: true,
        platform: "facebook",
        type: "platform-video",
        mediaType: mediaType,
        originalUrl: url.href,
        previewSupported: true,
        downloadSupported: false,
        qualitySelection: false,
        embedUrl:
          "https://www.facebook.com/plugins/video.php?href=" +
          encodeURIComponent(url.href) +
          "&show_text=false",
        message: "Facebook official embed may work for accessible public videos."
      };
    }

    if (platform === "vimeo") {
      const parts = url.pathname.split("/").filter(Boolean);
      const videoId = parts.find(function (part) {
        return /^\d+$/.test(part);
      });

      return {
        valid: Boolean(videoId),
        platform: "vimeo",
        type: "platform-video",
        videoId: videoId || null,
        originalUrl: url.href,
        previewSupported: Boolean(videoId),
        downloadSupported: false,
        qualitySelection: false,
        embedUrl: videoId
          ? "https://player.vimeo.com/video/" + videoId
          : null,
        message: "Vimeo official embed may work depending on video privacy settings."
      };
    }

    if (platform === "dailymotion") {
      const parts = url.pathname.split("/").filter(Boolean);
      let videoId = parts[0] || null;

      if (videoId && videoId.includes("_")) {
        videoId = videoId.split("_")[0];
      }

      return {
        valid: Boolean(videoId),
        platform: "dailymotion",
        type: "platform-video",
        videoId: videoId,
        originalUrl: url.href,
        previewSupported: Boolean(videoId),
        downloadSupported: false,
        qualitySelection: false,
        embedUrl: videoId
          ? "https://www.dailymotion.com/embed/video/" +
            encodeURIComponent(videoId)
          : null,
        message: "Dailymotion official embed may work where permitted."
      };
    }

    return {
      valid: true,
      platform: "unknown",
      type: "unknown",
      originalUrl: url.href,
      previewSupported: false,
      downloadSupported: false,
      qualitySelection: false,
      message: "This website is not yet supported. Try an authorized direct MP4 or WebM URL."
    };
  }

  window.VidloraURLDetector = Object.freeze({
    detect: detect,
    normalizeUrl: normalizeUrl
  });

})();
