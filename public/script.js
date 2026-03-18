const storyTrack = document.getElementById("storyTrack");
const nextStory = document.getElementById("nextStory");
const panels = Array.from(document.querySelectorAll(".story-panel"));
const pageBody = document.body;
const phoneStage = document.querySelector(".phone-stage");
const phoneShell = document.querySelector(".phone-shell");
const frontGlass = document.querySelector(".front-glass");

let activeIndex = 0;
let sequenceStarted = false;
let sequenceTimeout;
let parallaxFrame = 0;
let showcaseLocked = false;
let showcaseFrame = 0;
let entryStarted = false;

function removeStartListeners() {
  window.removeEventListener("mousemove", handleFirstInteraction);
  window.removeEventListener("touchstart", handleFirstInteraction);
  window.removeEventListener("keydown", handleFirstInteraction);
  window.removeEventListener("load", handleInitialLoad);
}

function renderStory(index) {
  if (!storyTrack) {
    return;
  }

  activeIndex = index;
  storyTrack.style.transform = `translateY(-${index * (100 / panels.length)}%)`;

  panels.forEach((panel, panelIndex) => {
    panel.classList.toggle("is-active", panelIndex === index);
  });
}

function cycleStory() {
  const nextIndex = (activeIndex + 1) % panels.length;
  renderStory(nextIndex);
}

function showUi() {
  if (!pageBody) {
    return;
  }

  pageBody.classList.add("reveal-ui");
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

function startSequence() {
  if (!storyTrack || panels.length === 0 || sequenceStarted) {
    return;
  }

  sequenceStarted = true;
  removeStartListeners();
  window.clearTimeout(sequenceTimeout);
  pageBody?.classList.remove("reveal-ui");
  renderStory(0);

  sequenceTimeout = window.setTimeout(() => {
    renderStory(2);
  }, 3200);

  sequenceTimeout = window.setTimeout(() => {
    showUi();
  }, 6400);
}

function handleFirstInteraction() {
  startSequence();
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

if (storyTrack && panels.length > 0) {
  renderStory(0);
}

if (nextStory) {
  nextStory.addEventListener("click", () => {
    startSequence();
  });
}

if (!sequenceStarted) {
  if (document.readyState === "complete") {
    handleInitialLoad();
  } else {
    window.addEventListener("load", handleInitialLoad, { once: true });
  }
}

if (phoneStage && phoneShell) {
  phoneStage.addEventListener("mousemove", handleParallax);
  phoneStage.addEventListener("mouseleave", resetParallax);
  resetParallax();
}
