import { useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/**
 * Brings each section's contents in as it arrives.
 *
 * This used to stage two things — a sheet of flat ink scrubbed off the section
 * first, then its contents behind it. The sheet belonged to the era of one
 * gradient per section; the page now carries a single ramp across its whole
 * height (see `#root`), and a curtain lifting at every boundary is the seam
 * that ramp exists to remove.
 *
 * The contents are on a flag rather than scrubbed, because they are not a
 * gradient: half-faded copy that tracks the scrollbar is a worse read than copy
 * that simply arrives.
 */

/** How far into the section's approach the contents follow. */
const CONTENT_AT = 0.62

export function useReveal(selector: string) {
  useEffect(() => {
    const targets = [...document.querySelectorAll<HTMLElement>(selector)]
    if (!targets.length) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      // The reveal is presentation, and a reader who has asked for less motion
      // still needs the page to be there.
      targets.forEach((t) => {
        t.dataset.shown = ''
      })
      return
    }

    const triggers = targets.map((el) => {
      return ScrollTrigger.create({
        trigger: el,
        // The section's approach: its first pixel on screen, then two thirds of
        // a window of scroll — which is the same range `top 33%` describes, but
        // written as a distance so it can be CAPPED by the section's own height.
        //
        // That cap is load-bearing for the last section on the page. A section
        // can only ever be scrolled as far as its own height allows once its
        // top has entered the window, so the footer — 187px tall on a phone
        // against a 780px window — could reach 76% of the way up and no
        // further. `top 33%` was unreachable, progress stopped at 0.36, and the
        // flag this whole hook exists to set was never set: the field stayed
        // clipped, every piece stayed at opacity 0, and the footer was
        // invisible on every phone. It was not missing, it was permanently
        // mid-reveal.
        //
        // Capped, a short section finishes its reveal exactly as its last pixel
        // of scroll runs out, and a tall one is unchanged.
        start: 'top bottom',
        end: () =>
          '+=' + Math.min(window.innerHeight * 0.67, el.offsetHeight),
        scrub: 0.6,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          // Once only — a section that has arrived stays arrived, or scrolling
          // back up re-fades copy the reader is in the middle of.
          if (self.progress >= CONTENT_AT && !('shown' in el.dataset)) {
            el.dataset.shown = ''
          }
        },
      })
    })

    return () => triggers.forEach((t) => t.kill())
  }, [selector])
}
