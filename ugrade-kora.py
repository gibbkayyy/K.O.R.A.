from pathlib import Path
import re

FILE = Path("public/index.html")

html = FILE.read_text(encoding="utf-8")

# ------------------------------------------------------------
# K.O.R.A. UPGRADE PATCH
# ------------------------------------------------------------

CSS = r"""
/* ============================================================
   K.O.R.A. 2026 UI UPGRADE
   White / Charcoal — no green
============================================================ */

:root {
  --kora-bg: #101114;
  --kora-panel: rgba(27, 28, 32, .88);
  --kora-panel-light: rgba(255,255,255,.055);
  --kora-border: rgba(255,255,255,.12);
  --kora-border-strong: rgba(255,255,255,.2);
  --kora-text: #f5f5f6;
  --kora-muted: #9c9da3;
  --kora-soft: #d0d0d4;
}

html,
body {
  background: var(--kora-bg) !important;
  color: var(--kora-text) !important;
}

/* Remove old green accents */
*[style*="green"],
*[style*="#00ff"],
*[style*="#0f0"],
*[style*="#00ff00"] {
  color: var(--kora-text) !important;
  border-color: var(--kora-border) !important;
  background-color: transparent;
}

/* Better background */
body::before {
  content: "";
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: -2;

  background:
    radial-gradient(
      circle at 50% 42%,
      rgba(255,255,255,.045),
      transparent 38%
    ),
    linear-gradient(
      135deg,
      #0e0f11,
      #17181b 50%,
      #0e0f11
    );
}

body::after {
  content: "";
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: -1;

  opacity: .32;

  background-image:
    linear-gradient(
      rgba(255,255,255,.035) 1px,
      transparent 1px
    ),
    linear-gradient(
      90deg,
      rgba(255,255,255,.035) 1px,
      transparent 1px
    );

  background-size: 76px 76px;

  mask-image:
    radial-gradient(
      ellipse at center,
      black 0%,
      transparent 82%
    );
}

/* Orb */
.kora-upgraded-orb {
  position: relative;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;

  width: 230px !important;
  height: 230px !important;

  border-radius: 50%;

  background:
    radial-gradient(
      circle at 35% 28%,
      #45474d 0%,
      #292b30 35%,
      #1c1d21 68%,
      #101114 100%
    ) !important;

  border: 1px solid rgba(255,255,255,.3) !important;

  box-shadow:
    inset 0 0 35px rgba(255,255,255,.06),
    0 0 55px rgba(0,0,0,.65),
    0 0 120px rgba(255,255,255,.035);

  transition:
    transform .8s cubic-bezier(.2,.8,.2,1),
    width .8s cubic-bezier(.2,.8,.2,1),
    height .8s cubic-bezier(.2,.8,.2,1);
}

.kora-upgraded-orb::before {
  content: "";
  position: absolute;
  inset: 15px;
  border-radius: 50%;
  border: 1px solid rgba(255,255,255,.13);
}

.kora-upgraded-orb::after {
  content: "";
  position: absolute;
  inset: 31px;
  border-radius: 50%;
  border: 1px solid rgba(255,255,255,.07);
}

.kora-orb-title {
  position: relative;
  z-index: 5;

  width: 100%;
  text-align: center;

  color: #f7f7f8 !important;

  font-size: 30px !important;
  line-height: 1 !important;
  font-weight: 700 !important;

  letter-spacing: 5px !important;

  white-space: nowrap;

  text-shadow:
    0 0 12px rgba(255,255,255,.22);

  transform: none !important;
}

.kora-orb-subtitle {
  position: relative;
  z-index: 5;

  margin-top: 12px;

  color: rgba(255,255,255,.43) !important;

  font-size: 7px !important;
  letter-spacing: 3px !important;

  text-align: center;
}

/* Opening animation */
.kora-orb-opening {
  animation:
    koraOrbBoot 1.55s cubic-bezier(.2,.8,.2,1) forwards;
}

@keyframes koraOrbBoot {

  0% {
    width: 8px;
    height: 8px;
    opacity: 0;
    transform: scale(.3);
  }

  45% {
    width: 275px;
    height: 275px;
    opacity: 1;
  }

  70% {
    width: 220px;
    height: 220px;
  }

  100% {
    width: 230px;
    height: 230px;
    opacity: 1;
    transform: scale(1);
  }

}

.kora-text-fade {
  opacity: 0;
  animation:
    koraTextFade .65s ease 1s forwards;
}

@keyframes koraTextFade {

  from {
    opacity: 0;
    transform: translateY(7px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }

}

/* Information panels */
.kora-information-panel {
  display: none;

  width: min(850px, calc(100% - 30px));

  margin: 30px auto 0;

  padding: 24px;

  border:
    1px solid var(--kora-border-strong);

  border-radius: 20px;

  background:
    linear-gradient(
      135deg,
      rgba(255,255,255,.055),
      rgba(255,255,255,.018)
    );

  backdrop-filter: blur(20px);

  box-shadow:
    0 25px 80px rgba(0,0,0,.3);

  animation:
    koraPanelIn .55s cubic-bezier(.2,.8,.2,1);
}

.kora-information-panel.visible {
  display: block;
}

@keyframes koraPanelIn {

  from {
    opacity: 0;
    transform:
      translateY(25px)
      scale(.95);
  }

  to {
    opacity: 1;
    transform:
      translateY(0)
      scale(1);
  }

}

/* Mobile */
@media (max-width: 700px) {

  .kora-upgraded-orb {
    width: 185px !important;
    height: 185px !important;
  }

  .kora-orb-title {
    font-size: 23px !important;
    letter-spacing: 3px !important;
  }

  .kora-orb-subtitle {
    font-size: 5px !important;
  }

}
"""

JS = r"""
/* ============================================================
   K.O.R.A. FEATURE ENGINE
============================================================ */

(() => {

  "use strict";

  const MEMORY_KEY =
    "KORA_PERMANENT_MEMORY_V2";

  const USAGE_KEY =
    "KORA_USAGE_V2";

  const DEFAULT_LOCATION =
    "Rothbury, UK";

  let koraSpeaking = false;
  let koraListening = true;
  let recognition = null;
  let installPrompt = null;
  let lastKoraSpeech = "";
  let cameraStream = null;

  /* ==========================================================
     MEMORY
  ========================================================== */

  function getMemory() {

    try {

      const value =
        localStorage.getItem(
          MEMORY_KEY
        );

      return value
        ? JSON.parse(value)
        : [];

    } catch {

      return [];

    }

  }

  function remember(value) {

    value =
      String(value || "")
        .trim();

    if (!value) return;

    const memory =
      getMemory();

    if (
      !memory.some(
        x =>
          x.toLowerCase() ===
          value.toLowerCase()
      )
    ) {

      memory.push(value);

      /*
       * Deliberately never remove memory.
       */

      localStorage.setItem(
        MEMORY_KEY,
        JSON.stringify(memory)
      );

    }

  }

  window.KORA_MEMORY = {
    get: getMemory,
    remember
  };

  /* ==========================================================
     USAGE
  ========================================================== */

  function getUsage() {

    try {

      return JSON.parse(
        localStorage.getItem(
          USAGE_KEY
        )
      ) || {
        tokens: 0,
        requests: 0
      };

    } catch {

      return {
        tokens: 0,
        requests: 0
      };

    }

  }

  function saveUsage(value) {

    localStorage.setItem(
      USAGE_KEY,
      JSON.stringify(value)
    );

  }

  window.KORA_USAGE = {
    get: getUsage,
    save: saveUsage
  };

  /* ==========================================================
     VOICE
  ========================================================== */

  function findFemaleVoice() {

    if (
      !window.speechSynthesis
    ) return null;

    const voices =
      speechSynthesis.getVoices();

    const preferred = [
      "Samantha",
      "Karen",
      "Victoria",
      "Jenny",
      "Aria",
      "Google UK English Female",
      "Google US English Female"
    ];

    for (
      const wanted of preferred
    ) {

      const voice =
        voices.find(
          v =>
            v.name
              .toLowerCase()
              .includes(
                wanted.toLowerCase()
              )
        );

      if (voice) return voice;

    }

    return (
      voices.find(
        v =>
          /female|woman/i
            .test(v.name)
      ) ||
      voices.find(
        v =>
          /^en(-|_)/i
            .test(v.lang)
      ) ||
      voices[0] ||
      null
    );

  }

  function stopRecognition() {

    if (!recognition) return;

    try {
      recognition.stop();
    } catch {}

  }

  function speak(text) {

    if (!text) return;

    koraSpeaking = true;
    lastKoraSpeech = text;

    stopRecognition();

    if (
      !window.speechSynthesis
    ) {

      koraSpeaking = false;
      startRecognition();

      return;

    }

    speechSynthesis.cancel();

    const utterance =
      new SpeechSynthesisUtterance(
        text
      );

    const voice =
      findFemaleVoice();

    if (voice)
      utterance.voice = voice;

    utterance.lang = "en-GB";
    utterance.rate = .96;
    utterance.pitch = 1.02;
    utterance.volume = 1;

    utterance.onend =
      utterance.onerror =
        () => {

          koraSpeaking = false;

          setTimeout(
            startRecognition,
            200
          );

        };

    speechSynthesis.speak(
      utterance
    );

  }

  /* ==========================================================
     SPEECH RECOGNITION
  ========================================================== */

  function startRecognition() {

    if (
      !koraListening ||
      koraSpeaking ||
      !recognition
    ) return;

    try {
      recognition.start();
    } catch {}

  }

  function setupRecognition() {

    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      return;
    }

    recognition =
      new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "en-GB";
    recognition.maxAlternatives = 1;

    recognition.onresult =
      event => {

        if (koraSpeaking)
          return;

        const result =
          event.results[
            event.results.length - 1
          ];

        if (!result.isFinal)
          return;

        let text =
          result[0]
            ?.transcript
            ?.trim();

        if (!text)
          return;

        /*
         * Prevent K.O.R.A. hearing
         * her own previous answer.
         */

        const clean =
          x =>
            x
              .toLowerCase()
              .replace(
                /[^a-z0-9\s]/g,
                ""
              )
              .trim();

        if (
          lastKoraSpeech &&
          (
            clean(text) ===
            clean(lastKoraSpeech) ||
            clean(lastKoraSpeech)
              .includes(clean(text))
          )
        ) {
          return;
        }

        /*
         * "Hey Kora" is always interpreted
         * as Kora — never "Core".
         */

        text =
          text.replace(
            /hey\s+(kora|core)/ig,
            ""
          ).trim();

        if (!text)
          return;

        window.KORA_SEND?.(
          text
        );

      };

    recognition.onend =
      () => {

        if (
          koraListening &&
          !koraSpeaking
        ) {

          setTimeout(
            startRecognition,
            300
          );

        }

      };

    recognition.onerror =
      () => {

        if (
          koraListening &&
          !koraSpeaking
        ) {

          setTimeout(
            startRecognition,
            500
          );

        }

      };

    startRecognition();

  }

  /* ==========================================================
     SPECIAL COMMANDS
  ========================================================== */

  function removeRequested(text) {

    const value =
      text.toLowerCase();

    if (
      value.includes("remove") &&
      (
        value.includes("weather") ||
        value.includes("time") ||
        value.includes("date") ||
        value.includes("news")
      )
    ) {

      if (
        value.includes("weather")
      ) {

        document
          .querySelectorAll(
            ".kora-weather-panel"
          )
          .forEach(
            x =>
              x.remove()
          );

      }

      if (
        value.includes("time") ||
        value.includes("date")
      ) {

        document
          .querySelectorAll(
            ".kora-datetime-panel"
          )
          .forEach(
            x =>
              x.remove()
          );

      }

      if (
        value.includes("news")
      ) {

        document
          .querySelectorAll(
            ".kora-news-panel"
          )
          .forEach(
            x =>
              x.remove()
          );

      }

      return true;

    }

    return false;

  }

  function showDateTime() {

    let panel =
      document.querySelector(
        ".kora-datetime-panel"
      );

    if (!panel) {

      panel =
        document.createElement(
          "section"
        );

      panel.className =
        "kora-information-panel kora-datetime-panel";

      document.body.appendChild(
        panel
      );

    }

    panel.innerHTML = `
      <div style="
        font-size:11px;
        letter-spacing:2px;
        color:#9c9da3;
        text-transform:uppercase;
        margin-bottom:15px;
      ">
        Date & Time
      </div>

      <div style="
        font-size:clamp(38px,7vw,64px);
        font-weight:600;
      ">
        ${new Date().toLocaleTimeString(
          "en-GB",
          {
            hour:"2-digit",
            minute:"2-digit",
            second:"2-digit"
          }
        )}
      </div>

      <div style="
        margin-top:10px;
        color:#d0d0d4;
      ">
        ${new Date().toLocaleDateString(
          "en-GB",
          {
            weekday:"long",
            day:"numeric",
            month:"long",
            year:"numeric"
          }
        )}
      </div>
    `;

    panel.classList.add(
      "visible"
    );

  }

  function extractLocation(text) {

    const match =
      text.match(
        /(?:weather|forecast)\s+(?:in|for|at)\s+(.+)/i
      );

    return match
      ? match[1].trim()
      : DEFAULT_LOCATION;

  }

  async function showWeather(
    location = DEFAULT_LOCATION
  ) {

    let panel =
      document.querySelector(
        ".kora-weather-panel"
      );

    if (!panel) {

      panel =
        document.createElement(
          "section"
        );

      panel.className =
        "kora-information-panel kora-weather-panel";

      document.body.appendChild(
        panel
      );

    }

    panel.classList.add(
      "visible"
    );

    panel.innerHTML = `
      <div style="
        color:#9c9da3;
        font-size:11px;
        letter-spacing:2px;
        text-transform:uppercase;
      ">
        Weather
      </div>

      <div style="
        margin-top:15px;
        font-size:16px;
      ">
        ${location}
      </div>

      <div
        class="kora-weather-result"
        style="
          margin-top:20px;
          font-size:38px;
        "
      >
        Loading…
      </div>
    `;

    try {

      const geo =
        await fetch(
          "https://geocoding-api.open-meteo.com/v1/search?" +
          new URLSearchParams({
            name:
              location.replace(
                /,\s*UK$/i,
                ""
              ),
            count:"1",
            language:"en",
            format:"json"
          })
        )
        .then(
          r => r.json()
        );

      const place =
        geo?.results?.[0];

      if (!place)
        throw new Error(
          "Location not found"
        );

      const weather =
        await fetch(
          "https://api.open-meteo.com/v1/forecast?" +
          new URLSearchParams({
            latitude:
              place.latitude,
            longitude:
              place.longitude,
            current:
              "temperature_2m,apparent_temperature,weather_code,wind_speed_10m",
            timezone:"auto"
          })
        )
        .then(
          r => r.json()
        );

      const c =
        weather.current;

      const result =
        panel.querySelector(
          ".kora-weather-result"
        );

      result.innerHTML = `
        ${Math.round(
          c.temperature_2m
        )}°C

        <div style="
          margin-top:10px;
          font-size:15px;
          color:#cfcfd3;
        ">
          Feels like
          ${Math.round(
            c.apparent_temperature
          )}°C
          · Wind
          ${Math.round(
            c.wind_speed_10m
          )} km/h
        </div>
      `;

    } catch {

      panel.querySelector(
        ".kora-weather-result"
      ).textContent =
        "Weather unavailable.";

    }

  }

  async function showNews() {

    let panel =
      document.querySelector(
        ".kora-news-panel"
      );

    if (!panel) {

      panel =
        document.createElement(
          "section"
        );

      panel.className =
        "kora-information-panel kora-news-panel";

      document.body.appendChild(
        panel
      );

    }

    panel.classList.add(
      "visible"
    );

    panel.innerHTML = `
      <div style="
        color:#9c9da3;
        font-size:11px;
        letter-spacing:2px;
        text-transform:uppercase;
      ">
        Latest News
      </div>

      <div
        class="kora-news-results"
        style="margin-top:18px"
      >
        Loading latest headlines…
      </div>
    `;

    try {

      const data =
        await fetch(
          "https://api.rss2json.com/v1/api.json?" +
          new URLSearchParams({
            rss_url:
              "https://feeds.bbci.co.uk/news/rss.xml"
          })
        )
        .then(
          r => r.json()
        );

      const items =
        data.items?.slice(
          0,
          6
        ) || [];

      panel.querySelector(
        ".kora-news-results"
      ).innerHTML =
        items.map(
          item => `
            <div style="
              padding:14px 0;
              border-bottom:
                1px solid rgba(255,255,255,.08);
            ">
              <strong>
                ${escapeHtml(
                  item.title
                )}
              </strong>

              <div style="
                margin-top:6px;
                color:#999ba1;
                font-size:11px;
              ">
                ${escapeHtml(
                  item.pubDate || ""
                )}
              </div>
            </div>
          `
        ).join("");

    } catch {

      panel.querySelector(
        ".kora-news-results"
      ).textContent =
        "News unavailable.";

    }

  }

  function escapeHtml(value) {

    return String(value)
      .replaceAll("&","&amp;")
      .replaceAll("<","&lt;")
      .replaceAll(">","&gt;")
      .replaceAll('"',"&quot;")
      .replaceAll("'","&#039;");

  }

  /* ==========================================================
     INSTALL APP
  ========================================================== */

  window.addEventListener(
    "beforeinstallprompt",
    event => {

      event.preventDefault();

      installPrompt =
        event;

      window.KORA_INSTALL_AVAILABLE =
        true;

    }
  );

  window.KORA_INSTALL =
    async function() {

      if (!installPrompt) {

        return false;

      }

      installPrompt.prompt();

      await installPrompt.userChoice;

      installPrompt =
        null;

      return true;

    };

  window.addEventListener(
    "appinstalled",
    () => {

      installPrompt =
        null;

    }
  );

  /* ==========================================================
     CAMERA
  ========================================================== */

  window.KORA_CAMERA =
    async function() {

      if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices
          .getUserMedia
      ) {

        throw new Error(
          "Camera unavailable."
        );

      }

      cameraStream =
        await navigator.mediaDevices
          .getUserMedia({
            video:{
              facingMode:
                "environment"
            },
            audio:false
          });

      return cameraStream;

    };

  window.KORA_CLOSE_CAMERA =
    function() {

      if (!cameraStream)
        return;

      cameraStream
        .getTracks()
        .forEach(
          track =>
            track.stop()
        );

      cameraStream =
        null;

    };

  /* ==========================================================
     COMMAND ROUTER
  ========================================================== */

  window.KORA_SPECIAL_COMMAND =
    function(text) {

      const value =
        text.toLowerCase();

      if (
        removeRequested(text)
      ) {

        return true;

      }

      if (
        value.includes(
          "date and time"
        ) ||
        value.includes(
          "show me the date"
        ) ||
        value.includes(
          "show me the time"
        ) ||
        value.includes(
          "what time is it"
        ) ||
        value.includes(
          "pull up the date"
        ) ||
        value.includes(
          "pull up the time"
        )
      ) {

        showDateTime();

        return true;

      }

      if (
        value.includes("weather")
      ) {

        showWeather(
          extractLocation(text)
        );

        return true;

      }

      if (
        value.includes("news")
      ) {

        showNews();

        return true;

      }

      return false;

    };

  /* ==========================================================
     START
  ========================================================== */

  window.addEventListener(
    "load",
    () => {

      setupRecognition();

      setTimeout(
        () => {

          if (
            !window.speechSynthesis
          )
            return;

          speak(
            "All systems online, sir."
          );

        },
        1800
      );

    }
  );

})();
"""

# ------------------------------------------------------------
# Inject CSS before </head>
# ------------------------------------------------------------

if "K.O.R.A. 2026 UI UPGRADE" not in html:

    html = html.replace(
        "</head>",
        f"<style>{CSS}</style>\n</head>",
        1
    )

# ------------------------------------------------------------
# Inject JS before </body>
# ------------------------------------------------------------

if "K.O.R.A. FEATURE ENGINE" not in html:

    html = html.replace(
        "</body>",
        f"<script>{JS}</script>\n</body>",
        1
    )

# ------------------------------------------------------------
# Save
# ------------------------------------------------------------

FILE.write_text(
    html,
    encoding="utf-8"
)

print(
    "K.O.R.A. upgraded successfully."
)
print(
    f"Updated: {FILE}"
)
