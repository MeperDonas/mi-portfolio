// Client-side DOM behavior:
//  - left identity column: staggered load cascade via IntersectionObserver
//  - right section deck: active-section tracking, staggered in/out reveals,
//    sliding nav indicator + active link, smooth anchor scrolling
//  - mouse-reactive background glow, terminal typewriter, CV preview modal
// Motion-heavy effects are gated behind prefers-reduced-motion; the modal and
// the snap deck itself always work.
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// --- Identity-column reveals (viewport-based, outside the deck) ---
const deckSections = Array.from(document.querySelectorAll<HTMLElement>('[data-section]'));
const heroReveals = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]')).filter(
  (el) => !el.closest('[data-section]'),
);

// Hero load cascade: each identity-column item reveals a little after the
// previous one on first paint (the observer fires immediately for above-the-
// fold content). Skipped under reduced motion; CSS flattens everything there.
if (!reducedMotion) {
  heroReveals.forEach((el, i) => {
    el.style.setProperty('--reveal-delay', `${Math.min(i * 80, 480)}ms`);
  });
}

if (!reducedMotion && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.15, rootMargin: '0px 0px -10% 0px' },
  );
  heroReveals.forEach((el) => observer.observe(el));
} else if (reducedMotion || !('IntersectionObserver' in window)) {
  heroReveals.forEach((el) => el.classList.add('is-visible'));
}

// --- Section deck: active section, reveals, nav indicator ---
const nav = document.querySelector<HTMLElement>('[data-split-nav]');
const navItems = nav
  ? Array.from(nav.querySelectorAll<HTMLElement>('[data-nav-item]'))
  : [];
const indicator = nav?.querySelector<HTMLElement>('[data-nav-indicator]');

// Staggered reveal: each deck item reveals a little after the previous one when
// its section becomes active. Skipped entirely under reduced motion (CSS shows
// everything immediately).
if (!reducedMotion) {
  for (const section of deckSections) {
    section.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el, i) => {
      el.style.setProperty('--reveal-delay', `${Math.min(i * 70, 600)}ms`);
    });
  }
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
  function resolveScroller(): HTMLElement | null {
    const el = document.querySelector<HTMLElement>('[data-scroll-root]');
    if (el && el.scrollHeight > el.clientHeight + 1) return el;
    return null;
  }

  function computeActive() {
    const scroller = resolveScroller();
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

// Nav anchors scroll within the deck (or the window on mobile).
const scrollBehavior: ScrollBehavior = reducedMotion ? 'auto' : 'smooth';

for (const link of document.querySelectorAll<HTMLAnchorElement>('[data-scroll-to]')) {
  link.addEventListener('click', (event) => {
    const id = link.getAttribute('data-scroll-to');
    const target = id ? document.getElementById(id) : null;
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: scrollBehavior, block: 'start' });
  });
}

for (const link of document.querySelectorAll<HTMLAnchorElement>('[data-scroll-top]')) {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    const scroller = document.querySelector<HTMLElement>('[data-scroll-root]');
    if (scroller && scroller.scrollHeight > scroller.clientHeight + 1) {
      scroller.scrollTo({ top: 0, behavior: scrollBehavior });
    } else {
      window.scrollTo({ top: 0, behavior: scrollBehavior });
    }
  });
}

// --- Terminal typewriter: types a Python print in a loop ---
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
