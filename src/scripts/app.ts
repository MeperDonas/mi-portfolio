// Client-side DOM behavior:
//  - page-wide scroll reveals: one IntersectionObserver adds .is-visible per
//    element as it enters view (works for both the window scroller on mobile
//    and the deck's internal scroller on lg+), with per-batch stagger delays
//  - right section deck: active-section tracking for the sliding nav indicator
//  - snappy eased programmatic scrolling for nav anchors and back-to-top
//  - mouse-reactive background glow, terminal typewriter, CV preview modal
// Motion-heavy effects are gated behind prefers-reduced-motion; the modal,
// language switching, and scrolling itself always work.
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Gates the hidden pre-reveal states in global.css. Base.astro also adds this
// class inline pre-paint so hidden states never flash before this module runs.
document.documentElement.classList.add('js');

const deckSections = Array.from(document.querySelectorAll<HTMLElement>('[data-section]'));

// --- Scroll reveals (page-wide, per element) --------------------------------
const revealEls = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));

if (!reducedMotion && 'IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      const revealed = entries.filter((entry) => entry.isIntersecting);
      if (revealed.length === 0) return;
      // Elements entering together cascade in reading order: sort each batch
      // top-to-bottom (DOM order as tiebreak) and stagger from there.
      revealed.sort((a, b) => {
        const delta = a.boundingClientRect.top - b.boundingClientRect.top;
        if (delta !== 0) return delta;
        return a.target.compareDocumentPosition(b.target) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
      });
      revealed.forEach((entry, i) => {
        const el = entry.target as HTMLElement;
        el.style.setProperty('--reveal-delay', `${Math.min(i * 90, 540)}ms`);
        el.classList.add('is-visible');
        revealObserver.unobserve(el);
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
  );
  revealEls.forEach((el) => revealObserver.observe(el));
} else {
  // Reduced motion or no IO support: everything visible immediately.
  revealEls.forEach((el) => el.classList.add('is-visible'));
}

// --- Section deck: active section + nav indicator ---------------------------
const nav = document.querySelector<HTMLElement>('[data-split-nav]');
const navItems = nav ? Array.from(nav.querySelectorAll<HTMLElement>('[data-nav-item]')) : [];
const indicator = nav?.querySelector<HTMLElement>('[data-nav-indicator]');

function getDeckScroller(): HTMLElement | null {
  const el = document.querySelector<HTMLElement>('[data-scroll-root]');
  return el && el.scrollHeight > el.clientHeight + 1 ? el : null;
}

function positionIndicator(item: HTMLElement) {
  if (!indicator) return;
  indicator.style.height = `${item.offsetHeight}px`;
  indicator.style.transform = `translateY(${item.offsetTop}px)`;
}

function moveIndicatorToActive() {
  if (!indicator) return;
  const target = navItems.find((item) => item.dataset.navItem === activeId);
  indicator.style.opacity = target ? '1' : '0';
  if (target) positionIndicator(target);
}

let activeId: string | null = null;

function setActiveSection(section: HTMLElement | null) {
  const id = section?.id ?? null;
  if (id === activeId) return;
  activeId = id;
  for (const s of deckSections) s.classList.toggle('is-active', s === section);
  for (const item of navItems) item.classList.toggle('is-active', item.dataset.navItem === id);
  moveIndicatorToActive();
}

if (deckSections.length > 0) {
  // The active section is the last one whose top is above a band at ~25% of the
  // scrolling viewport. A scroll-position computation (instead of a ratio-based
  // IntersectionObserver) is deterministic even for sections taller than the
  // viewport, where a fixed intersection threshold could never be crossed.
  function computeActive() {
    const scroller = getDeckScroller();
    const isWindow = scroller === null;
    const containerTop = isWindow ? 0 : scroller.getBoundingClientRect().top;
    const containerHeight = isWindow ? window.innerHeight : scroller.clientHeight;
    const bandTop = containerHeight * 0.25;

    let current: HTMLElement | null = null;
    for (const section of deckSections) {
      // Viewport-relative position of the section top within the scroller.
      // rect.top alone is scroll-dependent; subtracting containerTop makes the
      // comparison stable as the deck scrolls.
      const sectionTop = section.getBoundingClientRect().top - containerTop;
      if (sectionTop <= bandTop) current = section;
    }
    setActiveSection(current ?? deckSections[0]);
  }

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      computeActive();
      ticking = false;
    });
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  document.querySelector<HTMLElement>('[data-scroll-root]')?.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  computeActive();
}

// Nav hover micro-interaction: the indicator previews the hovered item and
// returns to the active section on leave.
if (nav) {
  for (const item of navItems) {
    item.addEventListener('pointerenter', () => positionIndicator(item));
  }
  nav.addEventListener('pointerleave', () => moveIndicatorToActive());
}

// --- Programmatic scrolling --------------------------------------------------
// Native smooth scrollIntoView takes long, browser-controlled paths that made
// the deck feel sluggish. These eased rAF scrolls run ~500ms with an out-expo
// curve: quick departure, gentle landing.
const easeOutExpo = (t: number): number => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));
let scrollAnimationFrame: number | null = null;

function animateScrollTo(targetTop: number, duration = 480): void {
  const deck = getDeckScroller();
  const from = deck ? deck.scrollTop : window.scrollY;
  const max = deck
    ? deck.scrollHeight - deck.clientHeight
    : document.documentElement.scrollHeight - window.innerHeight;
  const to = Math.max(0, Math.min(targetTop, max));

  if (scrollAnimationFrame !== null) cancelAnimationFrame(scrollAnimationFrame);
  if (reducedMotion || duration <= 0) {
    if (deck) deck.scrollTop = to;
    else window.scrollTo(0, to);
    return;
  }

  const start = performance.now();
  const step = (now: number): void => {
    const progress = Math.min(1, (now - start) / duration);
    const value = from + (to - from) * easeOutExpo(progress);
    if (deck) deck.scrollTop = value;
    else window.scrollTo(0, value);
    scrollAnimationFrame = progress < 1 ? requestAnimationFrame(step) : null;
  };
  scrollAnimationFrame = requestAnimationFrame(step);
}

for (const link of document.querySelectorAll<HTMLAnchorElement>('[data-scroll-to]')) {
  link.addEventListener('click', (event) => {
    const id = link.getAttribute('data-scroll-to');
    const target = id ? document.getElementById(id) : null;
    if (!target) return;
    event.preventDefault();
    const deck = getDeckScroller();
    // Target position inside whichever container actually scrolls.
    const top =
      deck && target.closest('[data-scroll-root]')
        ? target.getBoundingClientRect().top - deck.getBoundingClientRect().top + deck.scrollTop
        : target.getBoundingClientRect().top + window.scrollY;
    animateScrollTo(top);
  });
}

for (const link of document.querySelectorAll<HTMLAnchorElement>('[data-scroll-top]')) {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    animateScrollTo(0, 420);
  });
}

// --- Terminal typewriter: types a Python print in a loop --------------------
// Both locale copies stay in sync, so a language toggle always shows the
// already-typed result.
const typed = 'print("I love cats")';
const termEls = Array.from(document.querySelectorAll<HTMLElement>('.terminal-text'));
if (termEls.length > 0) {
  if (reducedMotion) {
    termEls.forEach((el) => {
      el.textContent = typed;
    });
  } else {
    let index = 0;
    let deleting = false;
    const typeDelay = 85;
    const holdDelay = 2400;
    const paint = () => {
      termEls.forEach((el) => {
        el.textContent = typed.slice(0, index);
      });
    };
    const step = () => {
      if (deleting) {
        index -= 1;
        paint();
        if (index === 0) deleting = false;
        window.setTimeout(step, typeDelay / 2);
      } else if (index < typed.length) {
        index += 1;
        paint();
        window.setTimeout(step, typeDelay);
      } else {
        window.setTimeout(() => {
          deleting = true;
          step();
        }, holdDelay);
      }
    };
    step();
  }
}

// --- Mouse-reactive background glow (lerped follow) ---
// Kept deliberately subtle: small radius, low alpha, slow lerp. The rAF loop
// only runs while the pointer is actually moving and parks itself once the
// glow settles, so an idle page costs zero frames.
if (!reducedMotion) {
  const glow = document.querySelector<HTMLElement>('.mouse-glow');
  if (glow) {
    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let x = targetX;
    let y = targetY;
    let rafId: number | null = null;
    const render = () => {
      x += (targetX - x) * 0.06;
      y += (targetY - y) * 0.06;
      glow.style.background = `radial-gradient(420px circle at ${x.toFixed(1)}px ${y.toFixed(1)}px, rgba(94, 106, 210, 0.05), transparent 65%)`;
      rafId =
        Math.abs(targetX - x) > 0.5 || Math.abs(targetY - y) > 0.5
          ? requestAnimationFrame(render)
          : null;
    };
    window.addEventListener(
      'pointermove',
      (event: PointerEvent) => {
        targetX = event.clientX;
        targetY = event.clientY;
        if (rafId === null) rafId = requestAnimationFrame(render);
      },
      { passive: true },
    );
  }
}

// --- CV preview modal ---
for (const button of document.querySelectorAll<HTMLElement>('[data-cv-open]')) {
  button.addEventListener('click', () => {
    const locale = button.closest('[data-locale]')?.getAttribute('data-locale');
    const modal = document.querySelector<HTMLElement>(
      `[data-cv-modal][data-cv-locale="${locale}"]`,
    );
    if (!modal) return;
    modal.hidden = false;
  });
}

for (const el of document.querySelectorAll<HTMLElement>('[data-cv-close]')) {
  el.addEventListener('click', () => {
    const modal = el.closest<HTMLElement>('[data-cv-modal]');
    if (modal) modal.hidden = true;
  });
}

document.addEventListener('keydown', (event: KeyboardEvent) => {
  if (event.key !== 'Escape') return;
  for (const modal of document.querySelectorAll<HTMLElement>('[data-cv-modal]')) {
    if (!modal.hidden) modal.hidden = true;
  }
});
