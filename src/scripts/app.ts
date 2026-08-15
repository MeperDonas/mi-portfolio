// Client-side DOM behavior: subtle scroll reveals, a mouse-reactive background
// glow, and a terminal typewriter, all gated behind prefers-reduced-motion.
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// --- Scroll reveals ---
if (!reducedMotion) {
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
if (!reducedMotion) {
  const glow = document.querySelector<HTMLElement>('.mouse-glow');
  if (glow) {
    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let x = targetX;
    let y = targetY;
    const render = () => {
      x += (targetX - x) * 0.08;
      y += (targetY - y) * 0.08;
      glow.style.background = `radial-gradient(500px circle at ${x.toFixed(1)}px ${y.toFixed(1)}px, rgba(94, 106, 210, 0.07), transparent 65%)`;
      requestAnimationFrame(render);
    };
    window.addEventListener(
      'pointermove',
      (event: PointerEvent) => {
        targetX = event.clientX;
        targetY = event.clientY;
      },
      { passive: true },
    );
    render();
  }
}
