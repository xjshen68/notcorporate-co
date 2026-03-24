const nextStory = document.getElementById("nextStory");
const pageBody = document.body;
const phoneStage = document.querySelector(".phone-stage");
const phoneShell = document.querySelector(".phone-shell");
const frontGlass = document.querySelector(".front-glass");
const scrollStory = document.getElementById("scrollStory");
const scrollLine = document.getElementById("scrollLine");
const scrollBrand = document.getElementById("scrollBrand");
const phoneVideo = document.getElementById("phoneVideo");
const soundToggle = document.getElementById("soundToggle");
const phoneVideoShell = document.querySelector(".phone-video-shell");
const introHeading = document.getElementById("introHeading");
const contactLink = document.querySelector(".scroll-brand-link");
const phoneDrift = document.getElementById("phoneDrift");
const DISABLE_PAGE_AUTO_SCROLL = true;
const ENABLE_PHONE_DISAPPEAR = false;

let sequenceStarted = false;
let sequenceTimeout;
let parallaxFrame = 0;
let showcaseLocked = false;
let showcaseFrame = 0;
let entryStarted = false;
let scrollSequenceStarted = false;
let scrollSequenceComplete = false;
let lastScrollY = window.scrollY;
let scrollLineTimeout;
let scrollLogoTimeout;
let autoRollTimeout;
let autoScrollFrame = 0;
let resetTimeout;
let soundUnlocked = false;
let typingInProgress = false;
let introRunId = 0;
let audioContext;
let analyticsReady = false;
let trackedFinalReveal = false;
let trackedPhoneVideoStart = false;
let phoneDragging = false;
let phoneHidden = false;
let lastPhoneTap = 0;
let phoneDragMoved = false;
const phoneDragOffset = { x: 0, y: 0 };
const phonePointerStart = { x: 0, y: 0 };

function isMobilePhoneLayout() {
  return window.matchMedia("(max-width: 720px)").matches;
}

function getMeasurementId() {
  return window.NOTCORPORATE_ANALYTICS?.measurementId?.trim() || "";
}

function loadAnalytics() {
  const measurementId = getMeasurementId();
  if (!measurementId || analyticsReady || typeof document === "undefined") {
    return;
  }

  const analyticsScript = document.createElement("script");
  analyticsScript.async = true;
  analyticsScript.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
  document.head.appendChild(analyticsScript);

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag() {
    window.dataLayer.push(arguments);
  };

  window.gtag("js", new Date());
  window.gtag("config", measurementId, {
    page_title: document.title,
    page_location: window.location.href
  });

  analyticsReady = true;
}

function trackEvent(name, params = {}) {
  if (!analyticsReady || typeof window.gtag !== "function") {
    return;
  }

  window.gtag("event", name, params);
}

const typingSteps = [
  { text: "atten", delay: 168 },
  { text: "r", delay: 210 },
  { pause: 620 },
  { delete: 1, delay: 230 },
  { pause: 260 },
  { text: "tion", delay: 168 },
  { text: " is ", delay: 184 },
  { text: "curremcy", delay: 168 },
  { pause: 860 },
  { delete: 3, delay: 230 },
  { pause: 320 },
  { text: "ncy", delay: 172 }
];

if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}

function removeStartListeners() {
  window.removeEventListener("load", handleInitialLoad);
}

function delay(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function ensureAudioContext() {
  if (audioContext || typeof window === "undefined") {
    return audioContext;
  }

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    return null;
  }

  audioContext = new AudioContextClass();
  return audioContext;
}

async function unlockAudio() {
  const context = ensureAudioContext();
  if (!context) {
    return false;
  }

  if (context.state === "suspended") {
    try {
      await context.resume();
    } catch (error) {
      return false;
    }
  }

  return context.state === "running";
}

function playTypingClick() {
  if (!typingInProgress || !soundUnlocked) {
    return;
  }

  const context = ensureAudioContext();
  if (!context || context.state !== "running") {
    return;
  }

  const now = context.currentTime;
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = "triangle";
  oscillator.frequency.setValueAtTime(1450 + Math.random() * 190, now);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.018, now + 0.004);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.055);

  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(now);
  oscillator.stop(now + 0.06);
}

function showUi() {
  if (!pageBody) {
    return;
  }

  pageBody.classList.add("reveal-ui");
}

function clearSequenceTimers() {
  window.clearTimeout(sequenceTimeout);
  window.clearTimeout(scrollLineTimeout);
  window.clearTimeout(scrollLogoTimeout);
  window.clearTimeout(autoRollTimeout);
  window.clearTimeout(resetTimeout);
  window.cancelAnimationFrame(autoScrollFrame);
  window.cancelAnimationFrame(showcaseFrame);
}

function resetExperience(shouldReplay = false) {
  clearSequenceTimers();

  sequenceStarted = false;
  entryStarted = false;
  scrollSequenceStarted = false;
  scrollSequenceComplete = false;
  showcaseLocked = false;
  lastScrollY = 0;
  introRunId += 1;
  typingInProgress = false;
  trackedFinalReveal = false;
  trackedPhoneVideoStart = false;
  phoneHidden = false;
  phoneDragging = false;

  pageBody?.classList.remove("reveal-ui", "phone-entered");
  scrollStory?.classList.remove("is-sequencing", "is-complete");
  scrollLine?.classList.remove("is-visible");
  phoneShell?.classList.remove("showcase-motion");
  phoneDrift?.classList.remove("is-dragging", "is-poofing", "is-hidden");
  phoneDrift?.classList.remove("is-mobile-free");
  phoneVideoShell?.classList.remove("is-playing");
  introHeading?.classList.remove("is-typing");
  soundUnlocked = false;
  if (introHeading) {
    introHeading.textContent = "";
  }
  if (phoneVideo) {
    phoneVideo.pause();
    phoneVideo.muted = true;
    phoneVideo.currentTime = 0;
  }
  updateSoundToggleUi();
  if (phoneDrift) {
    phoneDrift.style.left = "";
    phoneDrift.style.top = "";
    phoneDrift.style.right = "";
    phoneDrift.style.bottom = "";
  }
  resetParallax();
  window.scrollTo(0, 0);

  if (shouldReplay) {
    resetTimeout = window.setTimeout(() => {
      handleInitialLoad();
    }, 820);
  }
}

function startPhoneEntry() {
  if (!phoneShell || !pageBody || entryStarted || phoneHidden) {
    return;
  }

  entryStarted = true;
  window.setTimeout(() => {
    window.requestAnimationFrame(() => {
      pageBody.classList.add("phone-entered");
    });
  }, 220);
}

function startShowcaseMotion() {
  if (!phoneShell || window.innerWidth <= 980 || showcaseLocked) {
    return;
  }

  showcaseLocked = true;
  phoneShell.classList.add("showcase-motion");

  const duration = 5200;
  const start = performance.now();

  function animate(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 0.5 - 0.5 * Math.cos(progress * Math.PI);
    const angle = eased * Math.PI * 2;
    const orbitX = Math.cos(angle);
    const orbitY = Math.sin(angle);

    phoneShell.style.setProperty("--phone-rotate-x", `${4 + orbitY * 2.6}deg`);
    phoneShell.style.setProperty("--phone-rotate-y", `${-6 + orbitX * 3.4}deg`);
    phoneShell.style.setProperty("--phone-lift-y", `${-4 + Math.sin(angle * 0.5) * 4}px`);
    phoneShell.style.setProperty("--screen-rotate-x", `${-1.6 + orbitY * 1.05}deg`);
    phoneShell.style.setProperty("--screen-rotate-y", `${1.8 + orbitX * 1.4}deg`);
    phoneShell.style.setProperty("--screen-shift-x", `${orbitX * 3.5}px`);
    phoneShell.style.setProperty("--screen-shift-y", `${orbitY * 3}px`);
    phoneShell.style.setProperty("--glint-x", `${50 + orbitX * 18}%`);
    phoneShell.style.setProperty("--glint-y", `${32 + orbitY * 18}%`);

    if (progress < 1) {
      showcaseFrame = window.requestAnimationFrame(animate);
      return;
    }

    phoneShell.classList.remove("showcase-motion");
    showcaseLocked = false;
    resetParallax();
  }

  showcaseFrame = window.requestAnimationFrame(animate);
}

async function startPhoneVideo() {
  if (!phoneVideo) {
    return;
  }

  try {
    await phoneVideo.play();
    phoneVideoShell?.classList.add("is-playing");
    if (!trackedPhoneVideoStart) {
      trackEvent("phone_video_start", {
        event_category: "engagement",
        event_label: "hero_phone_video"
      });
      trackedPhoneVideoStart = true;
    }
  } catch (error) {
    phoneVideoShell?.classList.remove("is-playing");
  }
}

async function enableSound() {
  if (soundUnlocked) {
    return;
  }

  const unlocked = await unlockAudio();
  if (!unlocked) {
    return;
  }

  soundUnlocked = true;
  trackEvent("enable_sound", {
    event_category: "engagement",
    event_label: "phone_video_sound"
  });
  if (!phoneVideo) {
    return;
  }

  phoneVideo.muted = false;
  nextStory?.setAttribute("aria-label", "Video playing with sound");
  updateSoundToggleUi();

  try {
    await phoneVideo.play();
  } catch (error) {
    phoneVideo.muted = true;
    soundUnlocked = false;
    updateSoundToggleUi();
  }
}

function updateSoundToggleUi() {
  if (!soundToggle || !phoneVideo) {
    return;
  }

  const isMuted = phoneVideo.muted;
  soundToggle.textContent = isMuted ? "sound on" : "sound off";
  soundToggle.setAttribute("aria-label", isMuted ? "Enable sound" : "Disable sound");
}

async function togglePhoneSound() {
  if (!phoneVideo || phoneHidden) {
    return;
  }

  if (phoneVideo.muted) {
    await enableSound();
    updateSoundToggleUi();
    return;
  }

  phoneVideo.muted = true;
  soundUnlocked = false;
  nextStory?.setAttribute("aria-label", "Video muted");
  updateSoundToggleUi();
}

async function runTypedIntro(runId) {
  if (!introHeading) {
    return;
  }

  typingInProgress = true;
  introHeading.classList.add("is-typing");
  introHeading.textContent = "";

  for (const step of typingSteps) {
    if (runId !== introRunId) {
      return;
    }

    if (typeof step.text === "string") {
      for (const char of step.text) {
        if (runId !== introRunId) {
          return;
        }
        introHeading.textContent += char;
        playTypingClick();
        await delay(step.delay ?? 82);
      }
      continue;
    }

    if (typeof step.pause === "number") {
      await delay(step.pause);
      continue;
    }

    if (typeof step.delete === "number") {
      for (let index = 0; index < step.delete; index += 1) {
        if (runId !== introRunId) {
          return;
        }
        introHeading.textContent = introHeading.textContent.slice(0, -1);
        playTypingClick();
        await delay(step.delay ?? 100);
      }
    }
  }

  typingInProgress = false;
  introHeading.classList.remove("is-typing");
}

function startSequence() {
  if (sequenceStarted) {
    enableSound();
    return;
  }

  sequenceStarted = true;
  removeStartListeners();
  window.clearTimeout(sequenceTimeout);
  pageBody?.classList.remove("reveal-ui");
  startPhoneVideo();

  sequenceTimeout = window.setTimeout(() => {
    showUi();
  }, 2600);
}

async function handleInitialLoad() {
  const runId = introRunId;
  await delay(520);

  if (runId !== introRunId) {
    return;
  }

  await runTypedIntro(runId);

  if (runId !== introRunId) {
    return;
  }

  startPhoneEntry();
  window.setTimeout(() => {
    if (runId !== introRunId) {
      return;
    }
    startSequence();
  }, 520);
  window.setTimeout(() => {
    if (runId !== introRunId) {
      return;
    }
    startShowcaseMotion();
  }, 3000);
}

function resetParallax() {
  if (!phoneShell || window.innerWidth <= 980) {
    return;
  }

  phoneShell.style.setProperty("--phone-rotate-x", "4deg");
  phoneShell.style.setProperty("--phone-rotate-y", "-6deg");
  phoneShell.style.setProperty("--phone-lift-y", "0px");
  phoneShell.style.setProperty("--screen-rotate-x", "-1.6deg");
  phoneShell.style.setProperty("--screen-rotate-y", "1.8deg");
  phoneShell.style.setProperty("--screen-shift-x", "0px");
  phoneShell.style.setProperty("--screen-shift-y", "0px");
  phoneShell.style.setProperty("--glint-x", "50%");
  phoneShell.style.setProperty("--glint-y", "22%");
}

function handleParallax(event) {
  if (!phoneStage || !phoneShell || !frontGlass || window.innerWidth <= 980 || showcaseLocked || phoneDragging) {
    return;
  }

  const stageRect = phoneStage.getBoundingClientRect();
  const glassRect = frontGlass.getBoundingClientRect();
  const relativeX = (event.clientX - stageRect.left) / stageRect.width;
  const relativeY = (event.clientY - stageRect.top) / stageRect.height;
  const glassX = Math.max(0, Math.min(1, (event.clientX - glassRect.left) / glassRect.width));
  const glassY = Math.max(0, Math.min(1, (event.clientY - glassRect.top) / glassRect.height));
  // Compensate for the phone's 3D tilt so the glint stays visually centered lower on the screen.
  const correctedGlassY = Math.max(0, Math.min(1, glassY * glassY * 0.28 + glassY * 0.9));
  const offsetX = (relativeX - 0.5) * 2;
  const offsetY = (relativeY - 0.5) * 2;

  window.cancelAnimationFrame(parallaxFrame);
  parallaxFrame = window.requestAnimationFrame(() => {
    phoneShell.style.setProperty("--phone-rotate-x", `${4 - offsetY * 4.2}deg`);
    phoneShell.style.setProperty("--phone-rotate-y", `${-6 + offsetX * 5.6}deg`);
    phoneShell.style.setProperty("--phone-lift-y", `${Math.abs(offsetX) * -2.5}px`);
    phoneShell.style.setProperty("--screen-rotate-x", `${-1.6 - offsetY * 1.6}deg`);
    phoneShell.style.setProperty("--screen-rotate-y", `${1.8 + offsetX * 2.3}deg`);
    phoneShell.style.setProperty("--screen-shift-x", `${offsetX * 4.5}px`);
    phoneShell.style.setProperty("--screen-shift-y", `${offsetY * 3.5}px`);
    phoneShell.style.setProperty("--glint-x", `${glassX * 100}%`);
    phoneShell.style.setProperty("--glint-y", `${correctedGlassY * 100}%`);
  });
}

function startAutoRollToBottom() {
  if (DISABLE_PAGE_AUTO_SCROLL) {
    scrollSequenceComplete = true;
    return;
  }

  const startY = window.scrollY;
  const targetY = scrollStory
    ? Math.max(0, scrollStory.offsetTop + scrollStory.offsetHeight - window.innerHeight)
    : Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  const distance = targetY - startY;

  if (distance <= 4) {
    scrollSequenceComplete = true;
    return;
  }

  const duration = 2800;
  const start = performance.now();

  function animate(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    window.scrollTo(0, startY + distance * eased);

    if (progress < 1) {
      autoScrollFrame = window.requestAnimationFrame(animate);
      return;
    }

    window.scrollTo(0, targetY);
    scrollSequenceComplete = true;
  }

  window.cancelAnimationFrame(autoScrollFrame);
  autoScrollFrame = window.requestAnimationFrame(animate);
}

function maybeStartScrollSequence() {
  if (
    !scrollStory ||
    !scrollLine ||
    !scrollBrand ||
    scrollSequenceStarted
  ) {
    return;
  }

  const rect = scrollStory.getBoundingClientRect();
  const scrollingDown = window.scrollY > lastScrollY;
  const sectionEntered = rect.top <= window.innerHeight * 0.95 && rect.bottom > window.innerHeight * 0.2;

  lastScrollY = window.scrollY;

  if (!scrollingDown || !sectionEntered) {
    return;
  }

  scrollSequenceStarted = true;
  scrollStory.classList.add("is-sequencing");

  window.clearTimeout(scrollLineTimeout);
  window.clearTimeout(scrollLogoTimeout);

  scrollLineTimeout = window.setTimeout(() => {
    scrollLine.classList.add("is-visible");
  }, 1500);

  scrollLogoTimeout = window.setTimeout(() => {
    scrollStory.classList.add("is-complete");
    if (!trackedFinalReveal) {
      trackEvent("final_reveal_view", {
        event_category: "engagement",
        event_label: "scroll_brand_reveal"
      });
      trackedFinalReveal = true;
    }
  }, 3400);

  if (!DISABLE_PAGE_AUTO_SCROLL) {
    autoRollTimeout = window.setTimeout(() => {
      startAutoRollToBottom();
    }, 3900);
  } else {
    scrollSequenceComplete = true;
  }
}

function updateScrollStory() {
  if (!scrollStory || !scrollLine || !scrollBrand) {
    return;
  }

  if (scrollSequenceComplete) {
    lastScrollY = window.scrollY;
    return;
  }

  maybeStartScrollSequence();
}

function hidePhone() {
  if (!ENABLE_PHONE_DISAPPEAR || !phoneDrift || phoneHidden) {
    return;
  }

  phoneDrift.classList.add("is-poofing");
  window.setTimeout(() => {
    phoneHidden = true;
    phoneDrift.classList.add("is-hidden");
    phoneDrift.classList.remove("is-poofing", "is-dragging");
  }, 420);
}

function setupDraggablePhone() {
  if (!phoneDrift) {
    return;
  }

  const phoneToggleTarget = frontGlass || phoneShell || phoneDrift;

  const handlePhoneToggleTap = (event) => {
    const target = event.target;
    if (target instanceof HTMLElement && target.closest("[data-no-drag]")) {
      lastPhoneTap = 0;
      return;
    }

    if (phoneDragging || phoneDragMoved) {
      lastPhoneTap = 0;
      return;
    }

    const now = Date.now();
    if (now - lastPhoneTap < 280) {
      togglePhoneSound();
      lastPhoneTap = 0;
      return;
    }

    lastPhoneTap = now;
  };

  const onPointerMove = (event) => {
    if (!phoneDragging || phoneHidden) {
      return;
    }

    if (
      Math.abs(event.clientX - phonePointerStart.x) > 6 ||
      Math.abs(event.clientY - phonePointerStart.y) > 6
    ) {
      phoneDragMoved = true;
    }

    const stageRect = phoneStage?.getBoundingClientRect();
    const stageLeft = stageRect ? stageRect.left : 0;
    const stageTop = stageRect ? stageRect.top : 0;

    phoneDrift.style.left = `${event.clientX - stageLeft - phoneDragOffset.x}px`;
    phoneDrift.style.top = `${event.clientY - stageTop - phoneDragOffset.y}px`;
    phoneDrift.style.right = "auto";
    phoneDrift.style.bottom = "auto";
  };

  const endDrag = () => {
    phoneDragging = false;
    phoneDrift.classList.remove("is-dragging");
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", endDrag);
  };

  phoneDrift.addEventListener("pointerdown", (event) => {
    if (phoneHidden) {
      return;
    }

    const target = event.target;
    if (target instanceof HTMLElement && target.closest("[data-no-drag]")) {
      return;
    }

    const rect = phoneDrift.getBoundingClientRect();
    const stageRect = phoneStage?.getBoundingClientRect();
    const stageLeft = stageRect ? stageRect.left : 0;
    const stageTop = stageRect ? stageRect.top : 0;
    phoneDragOffset.x = event.clientX - rect.left;
    phoneDragOffset.y = event.clientY - rect.top;
    phonePointerStart.x = event.clientX;
    phonePointerStart.y = event.clientY;
    phoneDragMoved = false;
    phoneDragging = true;
    phoneDrift.classList.add("is-dragging");
    if (isMobilePhoneLayout()) {
      phoneDrift.classList.add("is-mobile-free");
    }
    phoneDrift.setPointerCapture?.(event.pointerId);
    phoneDrift.style.left = `${rect.left - stageLeft}px`;
    phoneDrift.style.top = `${rect.top - stageTop}px`;
    phoneDrift.style.right = "auto";
    phoneDrift.style.bottom = "auto";
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", endDrag);
  });

  phoneToggleTarget?.addEventListener("pointerup", handlePhoneToggleTap);
}

if (nextStory) {
  nextStory.addEventListener("click", () => {
    startSequence();
    enableSound();
  });
}

if (soundToggle) {
  soundToggle.addEventListener("click", () => {
    togglePhoneSound();
  });
}

setupDraggablePhone();

if (contactLink) {
  contactLink.addEventListener("click", () => {
    trackEvent("contact_click", {
      event_category: "conversion",
      event_label: "get_in_touch"
    });
  });
}

if (!sequenceStarted) {
  if (document.readyState === "complete") {
    loadAnalytics();
    resetExperience(false);
    handleInitialLoad();
  } else {
    window.addEventListener("load", () => {
      loadAnalytics();
      resetExperience(false);
      handleInitialLoad();
    }, { once: true });
  }
}

if (phoneStage && phoneShell) {
  phoneStage.addEventListener("mousemove", handleParallax);
  phoneStage.addEventListener("mouseleave", resetParallax);
  resetParallax();
}

window.addEventListener("pointerdown", () => {
  unlockAudio();
}, { passive: true });

window.addEventListener("keydown", () => {
  unlockAudio();
}, { passive: true });

window.addEventListener("scroll", updateScrollStory, { passive: true });
window.addEventListener("resize", updateScrollStory);
window.addEventListener("beforeunload", () => {
  window.scrollTo(0, 0);
});
window.addEventListener("pageshow", () => {
  window.scrollTo(0, 0);
});
updateScrollStory();
