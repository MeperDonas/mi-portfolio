// Client-side DOM behavior: theme toggle, scroll reveals, subtle hero parallax,
// and magnetic buttons. All motion is gated behind `prefers-reduced-motion`.
import {
  browserThemeStorage,
  persistTheme,
  resolveTheme,
  toggleTheme,
  type Theme,
} from '../lib/theme';

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
}

// --- Theme toggle ---
for (const button of document.querySelectorAll<HTMLElement>('[data-theme-toggle]')) {
  button.addEventListener('click', () => {
    const storage = browserThemeStorage();
    const next = toggleTheme(resolveTheme(storage));
    persistTheme(storage, next);
    applyTheme(next);
  });
}

if (prefersReducedMotion()) {
  // Reveals are already forced visible by the reduced-motion CSS; nothing else
  // needs to run, so bail out before wiring any animation.
} else {
  // --- Scroll reveals ---
  const revealEls = document.querySelectorAll<HTMLElement>('[data-reveal]');
  if ('IntersectionObserver' in window) {
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
    revealEls.forEach((el) => observer.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }

  // --- Hero glow parallax (subtle, pointer-driven) ---
  const glow = document.querySelector<HTMLElement>('.hero-glow');
  if (glow) {
    const strength = 24;
    const onPointer = (event: PointerEvent) => {
      const x = (event.clientX / window.innerWidth - 0.5) * strength;
      const y = (event.clientY / window.innerHeight - 0.5) * strength;
      glow.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    };
    window.addEventListener('pointermove', onPointer, { passive: true });
  }

  // --- Magnetic buttons ---
  for (const el of document.querySelectorAll<HTMLElement>('[data-magnetic]')) {
    el.addEventListener('pointermove', (event: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const x = (event.clientX - rect.left - rect.width / 2) * 0.2;
      const y = (event.clientY - rect.top - rect.height / 2) * 0.2;
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    });
    el.addEventListener('pointerleave', () => {
      el.style.transform = 'translate3d(0, 0, 0)';
    });
  }
}
