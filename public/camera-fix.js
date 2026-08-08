(() => {
  "use strict";

  const boot = () => {
    const frame = document.getElementById("koraFrame");
    if (!frame) return;

    const win = frame.contentWindow;
    const doc = frame.contentDocument;
    if (!win || !doc) return;

    const get = (id) => doc.getElementById(id);
    const panel = get("cameraPanel");
    const video = get("cameraVideo");
    const close = get("cameraClose");
    const snap = get("cameraSnap");
    const core = get("core");
    const transmission = get("transmission");
    const micState = get("micState");
    const statusMain = get("statusMain");
    const statusSub = get("statusSub");

    if (!panel || !video) return;

    let stream = null;
    let analysing = false;

    const stop = () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        stream = null;
      }
      video.pause?.();
      video.srcObject = null;
      panel.classList.remove("visible");
      core?.classList.remove("camera-mode");
      if (micState) micState.textContent = "MICROPHONE ACTIVE";
    };

    const fixedOpenCamera = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        transmission && (transmission.textContent = "Camera access is not available in this browser, Sir.");
        try { win.speak?.("Camera access is not available in this browser, Sir."); } catch {}
        return;
      }

      try {
        win.stopListening?.();
        if (stream) stop();

        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        });

        video.srcObject = stream;
        await video.play().catch(() => {});

        core?.classList.add("camera-mode");
        panel.classList.add("visible");
        if (micState) micState.textContent = "VISION ACTIVE";
        if (statusMain) statusMain.textContent = "VISION ACTIVE";
        if (statusSub) statusSub.textContent = "Kora can see through the camera";
        if (transmission) transmission.textContent = "Camera active, Sir. Ask me what you'd like me to identify.";

        try { win.speakWithoutConfirmation?.("Camera active, Sir. What would you like me to look at?"); } catch {}
      } catch (error) {
        console.error("K.O.R.A. camera error:", error);
        if (transmission) {
          transmission.textContent = error?.name === "NotAllowedError"
            ? "Camera permission was denied, Sir. Please allow camera access for K.O.R.A. and try again."
            : "I couldn't start the camera, Sir.";
        }
        try {
          win.speak?.(error?.name === "NotAllowedError"
            ? "Camera permission was denied, Sir. Please allow camera access and try again."
            : "I couldn't start the camera, Sir.");
        } catch {}
        win.restartListening?.();
      }
    };

    const fixedAnalyseCamera = async () => {
      if (analysing || !video.videoWidth || !video.videoHeight || !stream) return;
      analysing = true;

      if (statusMain) statusMain.textContent = "ANALYSING";
      if (statusSub) statusSub.textContent = "Kora is examining the image";
      if (micState) micState.textContent = "VISION PROCESSING";

      const canvas = doc.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext("2d", { willReadFrequently: false });
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const image = canvas.toDataURL("image/jpeg", 0.82);

      try {
        const endpoint = win.VISION_ENDPOINT;
        if (!endpoint) throw new Error("VISION_ENDPOINT is not configured");

        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image })
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || "Vision request failed");

        const result = data.reply || data.description || data.text || "I couldn't determine what I'm looking at, Sir.";
        if (transmission) transmission.textContent = result;
        try { win.speak?.(result); } catch {}
      } catch (error) {
        console.error("K.O.R.A. vision error:", error);
        if (transmission) transmission.textContent = "I couldn't analyse that image, Sir.";
        try { win.speak?.("I couldn't analyse that image, Sir."); } catch {}
      } finally {
        analysing = false;
        if (micState) micState.textContent = "VISION ACTIVE";
      }
    };

    // Replace the broken global camera functions while leaving the existing UI intact.
    win.openCamera = fixedOpenCamera;
    win.analyseCamera = fixedAnalyseCamera;
    win.closeCamera = stop;

    // The existing button is still useful for analysis, but there is no separate camera button.
    snap?.addEventListener("click", fixedAnalyseCamera, { capture: true });
    close?.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      stop();
      win.setState?.("LISTENING", "Kora is listening");
      transmission && (transmission.textContent = "Camera closed, Sir.");
      win.restartListening?.();
    }, { capture: true });

    // If K.O.R.A.'s voice-command handler calls the global function, it now reaches the fixed implementation.
    win.__koraCameraFixLoaded = true;
  };

  const frame = document.getElementById("koraFrame");
  frame?.addEventListener("load", () => setTimeout(boot, 50));
  if (frame?.contentDocument?.readyState === "complete") setTimeout(boot, 50);
})();
