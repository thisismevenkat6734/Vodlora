/* =========================================
   VIDLORA - VIDEO DOWNLOADER ENGINE
   File: js/downloader.js

   Supports:
   - Authorized direct MP4 links
   - Authorized direct WebM links
   - Browser-based video preview
   - Browser-supported direct downloads

   Does not:
   - Bypass DRM
   - Extract restricted social media videos
   - Proxy remote video files
   - Upload or store user videos
========================================= */

"use strict";


/* =========================================
   CONFIGURATION
========================================= */

const VIDLORA_CONFIG = {

  allowedExtensions: [
    "mp4",
    "webm"
  ],

  allowedMimeTypes: [
    "video/mp4",
    "video/webm"
  ],

  maxUrlLength: 4096,

  previewTimeout: 20000

};


/* =========================================
   DOM ELEMENTS
========================================= */

const downloaderForm = document.getElementById("downloadForm");

const videoUrlInput = document.getElementById("videoUrl");

const getVideoButton = document.getElementById("getVideoBtn");

const downloadStatus = document.getElementById("downloadStatus");

const videoResult = document.getElementById("videoResult");

const videoPreview = document.getElementById("videoPreview");

const videoFormat = document.getElementById("videoFormat");

const downloadLink = document.getElementById("downloadLink");


/* =========================================
   INITIALIZATION
========================================= */

if (downloaderForm) {

  downloaderForm.addEventListener(
    "submit",
    handleVideoSubmit
  );

}


/* =========================================
   HANDLE FORM SUBMISSION
========================================= */

async function handleVideoSubmit(event) {

  event.preventDefault();

  clearPreviousResult();

  const rawUrl = videoUrlInput.value.trim();

  const validatedUrl = validateVideoUrl(rawUrl);

  if (!validatedUrl.valid) {

    showStatus(
      validatedUrl.message,
      "error"
    );

    return;

  }

  setLoading(true);

  showStatus(
    "Checking the direct video link...",
    "info"
  );

  try {

    const extension = getVideoExtension(validatedUrl.url);

    if (!extension) {

      throw new Error(
        "This URL does not have a supported MP4 or WebM file extension."
      );

    }

    await checkVideoPreview(
      validatedUrl.url
    );

    displayVideoResult(
      validatedUrl.url,
      extension
    );

    showStatus(
      "Video preview is available. Check the video and download if permitted.",
      "success"
    );

  } catch (error) {

    console.error(
      "VIDLORA downloader error:",
      error
    );

    showStatus(
      getFriendlyError(error),
      "error"
    );

  } finally {

    setLoading(false);

  }

}


/* =========================================
   URL VALIDATION
========================================= */

function validateVideoUrl(value) {

  if (!value) {

    return {
      valid: false,
      message: "Please enter a video URL."
    };

  }

  if (value.length > VIDLORA_CONFIG.maxUrlLength) {

    return {
      valid: false,
      message: "The URL is too long."
    };

  }

  let parsedUrl;

  try {

    parsedUrl = new URL(value);

  } catch {

    return {
      valid: false,
      message: "Please enter a valid video URL."
    };

  }

  if (
    parsedUrl.protocol !== "https:" &&
    parsedUrl.protocol !== "http:"
  ) {

    return {
      valid: false,
      message: "Only HTTP and HTTPS video URLs are supported."
    };

  }

  if (
    parsedUrl.username ||
    parsedUrl.password
  ) {

    return {
      valid: false,
      message: "URLs containing embedded login credentials are not supported."
    };

  }

  if (
    parsedUrl.hostname === "localhost" ||
    parsedUrl.hostname.endsWith(".localhost") ||
    parsedUrl.hostname.endsWith(".local")
  ) {

    return {
      valid: false,
      message: "Local network addresses are not supported."
    };

  }

  return {
    valid: true,
    url: parsedUrl.href
  };

}


/* =========================================
   GET FILE EXTENSION
========================================= */

function getVideoExtension(url) {

  let parsedUrl;

  try {

    parsedUrl = new URL(url);

  } catch {

    return null;

  }

  const pathname = parsedUrl.pathname.toLowerCase();

  const extension = pathname.split(".").pop();

  if (
    VIDLORA_CONFIG.allowedExtensions.includes(extension)
  ) {

    return extension;

  }

  return null;

}


/* =========================================
   VIDEO PREVIEW CHECK
========================================= */

function checkVideoPreview(url) {

  return new Promise((resolve, reject) => {

    if (!videoPreview) {

      reject(
        new Error("Video preview is unavailable.")
      );

      return;

    }

    let completed = false;

    const timeout = setTimeout(() => {

      finish(
        new Error(
          "Video source did not respond in time. The server may block browser access."
        )
      );

    }, VIDLORA_CONFIG.previewTimeout);


    function cleanup() {

      clearTimeout(timeout);

      videoPreview.removeEventListener(
        "loadedmetadata",
        onLoaded
      );

      videoPreview.removeEventListener(
        "error",
        onError
      );

    }


    function finish(error) {

      if (completed) {
        return;
      }

      completed = true;

      cleanup();

      if (error) {
        reject(error);
      } else {
        resolve(true);
      }

    }


    function onLoaded() {

      if (
        !Number.isFinite(videoPreview.duration) &&
        videoPreview.duration !== Infinity
      ) {

        finish(
          new Error("Unable to read video metadata.")
        );

        return;

      }

      finish(null);

    }


    function onError() {

      finish(
        new Error(
          "Unable to preview this video. The source may block browser playback or use an unsupported format."
        )
      );

    }


    videoPreview.addEventListener(
      "loadedmetadata",
      onLoaded
    );

    videoPreview.addEventListener(
      "error",
      onError
    );

    videoPreview.preload = "metadata";

    videoPreview.src = url;

    videoPreview.load();

  });

}


/* =========================================
   DISPLAY VIDEO RESULT
========================================= */

function displayVideoResult(url, extension) {

  if (!videoResult || !downloadLink) {
    return;
  }

  videoFormat.textContent = extension.toUpperCase();

  downloadLink.href = url;

  downloadLink.setAttribute(
    "download",
    "vidlora-video." + extension
  );

  downloadLink.setAttribute(
    "rel",
    "noopener noreferrer"
  );

  videoResult.hidden = false;

  videoResult.scrollIntoView({
    behavior: "smooth",
    block: "nearest"
  });

}


/* =========================================
   DOWNLOAD LINK HANDLING
========================================= */

if (downloadLink) {

  downloadLink.addEventListener("click", () => {

    showStatus(
      "Your browser is opening the original video source. Download behavior depends on the source server.",
      "info"
    );

  });

}


/* =========================================
   STATUS MESSAGES
========================================= */

function showStatus(message, type = "info") {

  if (!downloadStatus) {
    return;
  }

  downloadStatus.textContent = message;

  downloadStatus.className =
    "status-message " + type;

  downloadStatus.hidden = false;

}


/* =========================================
   LOADING STATE
========================================= */

function setLoading(loading) {

  if (!getVideoButton) {
    return;
  }

  getVideoButton.disabled = loading;

  const buttonText =
    getVideoButton.querySelector("span:first-child");

  if (buttonText) {

    buttonText.textContent = loading
      ? "Checking..."
      : "Find Video";

  }

}


/* =========================================
   RESET PREVIOUS RESULT
========================================= */

function clearPreviousResult() {

  if (videoResult) {
    videoResult.hidden = true;
  }

  if (downloadStatus) {
    downloadStatus.hidden = true;
    downloadStatus.textContent = "";
    downloadStatus.className = "status-message";
  }

  if (videoPreview) {

    videoPreview.pause();

    videoPreview.removeAttribute("src");

    videoPreview.load();

  }

  if (downloadLink) {

    downloadLink.removeAttribute("href");

    downloadLink.removeAttribute("download");

  }

}


/* =========================================
   FRIENDLY ERROR MESSAGES
========================================= */

function getFriendlyError(error) {

  const message = error?.message || "";

  if (
    message.includes("Timeout") ||
    message.includes("time")
  ) {

    return "The video source did not respond. Please try again.";

  }

  if (
    message.includes("preview") ||
    message.includes("browser access")
  ) {

    return "This source may block browser preview. Check whether it provides an authorized direct download.";

  }

  if (
    message.includes("extension")
  ) {

    return message;

  }

  return message ||
    "Something went wrong. Please check your video link.";

}


/* =========================================
   CLEANUP ON PAGE EXIT
========================================= */

window.addEventListener("pagehide", () => {

  if (videoPreview) {

    videoPreview.pause();

    videoPreview.removeAttribute("src");

    videoPreview.load();

  }

});
