'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

/** Shared scroll interaction for the public site and every farmer-platform route.
 * Below desktop width, the full accessible menu stays available.
 * Animations respect prefers-reduced-motion via CSS.
 */
export function useHeaderMotion({enabled = true, locked = false}: {enabled?: boolean; locked?: boolean} = {}) {
  const pathname = usePathname();
  const [compact, setCompact] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!enabled) { setCompact(false); setScrolled(false); return; }
    // Reset a collapsed header after client-side navigation so menus are never stranded.
    setCompact(false);
    let lastY = Math.max(0, window.scrollY);
    let lastDirection = 0;
    let travel = 0;
    let animationFrame = 0;
    const desktop = () => window.matchMedia('(min-width: 1061px)').matches;
    const measure = () => {
      animationFrame = 0;
      const y = Math.max(0, window.scrollY);
      const delta = y - lastY;
      lastY = y;
      setScrolled(y > 32);
      if (y < 110 || !desktop() || locked) {
        setCompact(false);
        travel = 0;
        lastDirection = 0;
        return;
      }
      if (Math.abs(delta) < 1) return;
      const direction = Math.sign(delta);
      travel = direction === lastDirection ? travel + Math.abs(delta) : Math.abs(delta);
      lastDirection = direction;
      if (travel > 26 && (direction < 0 || y > 185)) {
        setCompact(direction > 0);
        travel = 0;
      }
    };
    const onScroll = () => { if (!animationFrame) animationFrame = requestAnimationFrame(measure); };
    const onResize = () => { if (!desktop()) setCompact(false); };
    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      if (animationFrame) cancelAnimationFrame(animationFrame);
    };
  }, [enabled, locked, pathname]);

  return { compact, scrolled, reveal: () => setCompact(false) };
}
