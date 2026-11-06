
"use strict";

const ALLOWED_ORIGIN =
  "https://thisismevenkat6734.github.io";

const MAX_URL_LENGTH = 2048;

const PLATFORM_RULES = [
  {
    name: "YouTube",
    hosts: ["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be"]
  },
  {
    name: "Instagram",
    hosts: ["instagram.com", "www.instagram.com"]
  },
  {
    name: "Facebook",
    hosts: ["facebook.com", "www.facebook.com", "m.facebook.com", "fb.watch"]
  },
  {
    name: "Vimeo",
    hosts: ["vimeo.com", "www.vimeo.com", "player.vimeo.com"]
  },
  {
    name: "Dailymotion",
    hosts: ["dailymotion.com", "www.dailymotion.com", "dai.ly"]
  }
];

function setCors(req, res) {
  const origin = req.headers.origin;

  if (origin === ALLOWED_ORIGIN) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }

  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
}

function identifyPlatform(hostname) {
  const host = hostname.toLowerCase();

  for (const platform of PLATFORM_RULES) {
    if (platform.hosts.includes(host)) {
      return platform.name;
    }
  }

  return null;
}

function validateVideoUrl(value) {
  if (typeof value !== "string" || value.length > MAX_URL_LENGTH) {
    return null;
  }

  let parsed;

  try {
    parsed = new URL(value.trim());
  } catch {
    return null;
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return null;
  }

  if (parsed.username || parsed.password) {
    return null;
  }

  const hostname = parsed.hostname.toLowerCase();

  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname) ||
    hostname.includes(":")
  ) {
    return null;
  }

  return parsed;
}

module.exports = function handler(req, res) {
  setCors(req, res);

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS");

    return res.status(405).json({
      success: false,
      error: "METHOD_NOT_ALLOWED"
    });
  }

  const body = req.body || {};
  const parsed = validateVideoUrl(body.url);

  if (!parsed) {
    return res.status(400).json({
      success: false,
      error: "INVALID_URL",
      message: "Please provide a valid public HTTP or HTTPS URL."
    });
  }

  const platform = identifyPlatform(parsed.hostname);

  if (platform) {
    return res.status(200).json({
      success: true,
      platform,
      type: "platform",
      preview: "official-embed-only",
      downloadAvailable: false,
      message:
        "Platform detected. This API does not extract or download platform videos."
    });
  }

  const pathname = parsed.pathname.toLowerCase();

  const extension = pathname.endsWith(".mp4")
    ? "mp4"
    : pathname.endsWith(".webm")
      ? "webm"
      : null;

  if (extension) {
    return res.status(200).json({
      success: true,
      platform: "Direct Video URL",
      type: "direct-video",
      extension,
      preview: "requires-source-verification",
      downloadAvailable: "not-yet-verified",
      message:
        "A possible direct video URL was detected. The actual file and download permission must be verified."
    });
  }

  return res.status(200).json({
    success: true,
    platform: "Unknown",
    type: "unsupported",
    preview: false,
    downloadAvailable: false,
    message:
      "This URL is not currently recognized as a supported video source."
  });
};
