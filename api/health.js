
/**
 * VIDLORA Backend
 * API Health Check
 *
 * Deployment: Vercel Serverless Functions
 * Runtime: Node.js
 *
 * This endpoint does not process or download videos.
 */

"use strict";

const ALLOWED_ORIGIN =
  "https://thisismevenkat6734.github.io";

module.exports = function handler(req, res) {
  // CORS configuration
  const origin = req.headers.origin;

  if (origin === ALLOWED_ORIGIN) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }

  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, OPTIONS"
  );

  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type"
  );

  res.setHeader(
    "Cache-Control",
    "no-store"
  );

  // Handle browser preflight
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  // Allow GET only
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET, OPTIONS");

    return res.status(405).json({
      success: false,
      error: "METHOD_NOT_ALLOWED",
      message: "Only GET requests are supported."
    });
  }

  return res.status(200).json({
    success: true,
    service: "VIDLORA Backend API",
    status: "online",
    version: "1.0.0",
    capabilities: {
      urlDetection: "planned",
      platformAdapters: "planned",
      qualityDetection: "planned",
      authorizedDownloads: "planned",
      videoStorage: false,
      database: false
    },
    timestamp: new Date().toISOString()
  });
};
