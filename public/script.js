const nextStory = document.getElementById("nextStory");
const pageBody = document.body;
const phoneStage = document.querySelector(".phone-stage");
const phoneShell = document.querySelector(".phone-shell");
const frontGlass = document.querySelector(".front-glass");
const scrollStory = document.getElementById("scrollStory");
const scrollLine = document.getElementById("scrollLine");
const scrollLogo = document.getElementById("scrollLogo");
const phoneVideo = document.getElementById("phoneVideo");
const soundToggle = document.getElementById("soundToggle");
const phoneVideoShell = document.querySelector(".phone-video-shell");

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
let autoScrollFrame = 0;
let resetTimeout;
let soundUnlocked = false;

if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}

function removeStartListeners() {
  window.removeEventListener("load", handleInitialLoad);
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

  pageBody?.classList.remove("reveal-ui", "phone-entered");
  scrollStory?.classList.remove("is-sequencing", "is-complete");
  scrollLine?.classList.remove("is-visible", "is-exiting");
  scrollLogo?.classList.remove("is-visible");
  phoneShell?.classList.remove("showcase-motion");
  phoneVideoShell?.classList.remove("is-playing");
  soundToggle?.classList.remove("is-visible");
  soundUnlocked = false;
  if (phoneVideo) {
    phoneVideo.pause();
    phoneVideo.muted = true;
    phoneVideo.currentTime = 0;
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
  if (!phoneShell || !pageBody || window.innerWidth <= 980 || entryStarted) {
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
    if (!soundUnlocked) {
      soundToggle?.classList.add("is-visible");
    }
  } catch (error) {
    phoneVideoShell?.classList.remove("is-playing");
  }
}

async function enableSound() {
  if (!phoneVideo || soundUnlocked) {
    return;
  }

  soundUnlocked = true;
  phoneVideo.muted = false;
  soundToggle?.classList.remove("is-visible");
  nextStory?.setAttribute("aria-label", "Video playing with sound");

  try {
    await phoneVideo.play();
  } catch (error) {
    phoneVideo.muted = true;
    soundUnlocked = false;
    soundToggle?.classList.add("is-visible");
  }
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

function handleInitialLoad() {
  window.setTimeout(() => {
    startPhoneEntry();
    window.setTimeout(() => {
      startSequence();
    }, 700);
    window.setTimeout(() => {
      startShowcaseMotion();
    }, 2850);
  }, 1000);
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
  if (!phoneStage || !phoneShell || !frontGlass || window.innerWidth <= 980 || showcaseLocked) {
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
  const finalBrand = document.querySelector(".final-brand");
  const startY = window.scrollY;
  const targetY = finalBrand
    ? Math.max(0, finalBrand.offsetTop)
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
    !scrollLogo ||
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
  scrollLine.classList.add("is-visible");

  window.clearTimeout(scrollLineTimeout);
  window.clearTimeout(scrollLogoTimeout);

  scrollLineTimeout = window.setTimeout(() => {
    scrollLine.classList.add("is-exiting");
  }, 2400);

  scrollLogoTimeout = window.setTimeout(() => {
    scrollStory.classList.add("is-complete");
    startAutoRollToBottom();
  }, 2600);
}

function updateScrollStory() {
  if (!scrollStory || !scrollLine || !scrollLogo) {
    return;
  }

  const scrollingUp = window.scrollY < lastScrollY;

  if (window.scrollY <= 8 && scrollingUp && (scrollSequenceStarted || scrollSequenceComplete)) {
    resetExperience(true);
    return;
  }

  if (scrollSequenceComplete) {
    lastScrollY = window.scrollY;
    return;
  }

  maybeStartScrollSequence();
}

if (nextStory) {
  nextStory.addEventListener("click", () => {
    startSequence();
    enableSound();
  });
}

if (soundToggle) {
  soundToggle.addEventListener("click", () => {
    enableSound();
  });
}

if (!sequenceStarted) {
  if (document.readyState === "complete") {
    resetExperience(false);
    handleInitialLoad();
  } else {
    window.addEventListener("load", () => {
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
  enableSound();
}, { passive: true });

window.addEventListener("keydown", () => {
  enableSound();
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
