"use strict";

const ALLOWED_ORIGIN =
  "https://thisismevenkat6734.github.io";

const MAX_URL_LENGTH = 2048;

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

function inspectUrl(value) {
  if (
    typeof value !== "string" ||
    !value.trim() ||
    value.length > MAX_URL_LENGTH
  ) {
    return {
      valid: false,
      error: "INVALID_URL",
      message: "Please provide a valid video URL."
    };
  }

  let parsed;

  try {
    parsed = new URL(value.trim());
  } catch {
    return {
      valid: false,
      error: "INVALID_URL",
      message: "The URL format is invalid."
    };
  }

  if (
    parsed.protocol !== "https:" &&
    parsed.protocol !== "http:"
  ) {
    return {
      valid: false,
      error: "UNSUPPORTED_PROTOCOL",
      message: "Only HTTP and HTTPS URLs are supported."
    };
  }

  if (parsed.username || parsed.password) {
    return {
      valid: false,
      error: "URL_CREDENTIALS_NOT_ALLOWED",
      message: "URLs containing embedded credentials are not accepted."
    };
  }

  const hostname = parsed.hostname.toLowerCase();

  if (
    !hostname ||
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal") ||
    hostname.endsWith(".test") ||
    hostname.endsWith(".invalid") ||
    hostname.endsWith(".example") ||
    hostname.includes(":") ||
    /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)
  ) {
    return {
      valid: false,
      error: "UNSAFE_HOST",
      message: "This host is not accepted."
    };
  }

  const pathname = parsed.pathname.toLowerCase();

  let format = null;

  if (pathname.endsWith(".mp4")) {
    format = "mp4";
  } else if (pathname.endsWith(".webm")) {
    format = "webm";
  }

  if (!format) {
    return {
      valid: false,
      error: "UNSUPPORTED_FORMAT",
      message: "Only direct MP4 and WebM file URLs are accepted."
    };
  }

  return {
    valid: true,
    format,
    hostname,
    secureConnection: parsed.protocol === "https:",
    verification: "url-pattern-only",
    message:
      "Possible direct video URL detected. Actual file content, availability, resolution and download permission are not yet verified."
  };
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
      error: "METHOD_NOT_ALLOWED",
      message: "Only POST requests are supported."
    });
  }

  const result = inspectUrl(
    req.body && req.body.url
  );

  if (!result.valid) {
    return res.status(400).json({
      success: false,
      error: result.error,
      message: result.message
    });
  }

  return res.status(200).json({
    success: true,
    type: "direct-video-candidate",
    format: result.format,
    hostname: result.hostname,
    secureConnection: result.secureConnection,
    verification: result.verification,
    downloadAvailable: "not-yet-verified",
    message: result.message
  });
};
