import { useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/**
 * Stages each section's arrival: the field changes first, then what stands on
 * it fades in behind it.
 *
 * The field is SCROLLED, not timed. As a 620ms transition it read as a flash —
 * the colour was simply different by the time the section was properly in view,
 * which is not a reveal. Tied to the scroll instead, it comes up across the
 * section's whole approach, so the reader is the one drawing it: a third of a
 * screen in, the field is a third changed.
 *
 * The contents stay on a flag, because they are not a gradient and should not
 * be scrubbed — half-faded copy that tracks the scrollbar is a worse read than
 * copy that simply arrives. `data-shown` goes on once the field is most of the
 * way there, which is what keeps the order: the page changes colour, and only
 * then does the reader see what arrived on it.
 */

/** How much of the field has to be up before the contents follow. */
const CONTENT_AT = 0.62

export function useReveal(selector: string) {
  useEffect(() => {
    const targets = [...document.querySelectorAll<HTMLElement>(selector)]
    if (!targets.length) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      // No stagger and no scrub: the reveal is presentation, and a reader who
      // has asked for less motion still needs the page to be there.
      targets.forEach((t) => {
        t.style.setProperty('--field', '0')
        t.dataset.shown = ''
      })
      return
    }

    const triggers = targets.map((el) => {
      el.style.setProperty('--field', '1')

      return ScrollTrigger.create({
        trigger: el,
        // From the section's first pixel on screen to a third of the way up it:
        // the field is drawn over the whole approach rather than at the moment
        // of arrival.
        start: 'top bottom',
        end: 'top 33%',
        scrub: 0.6,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          el.style.setProperty('--field', String(1 - self.progress))
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
