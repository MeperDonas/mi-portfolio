// Client-side DOM behavior: subtle scroll reveals and a mouse-reactive
// background glow, both gated behind prefers-reduced-motion.
if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
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

  // --- Mouse-reactive background glow (lerped follow) ---
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
