import { useEffect, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { scrollToSection } from './lib/useParallax'

gsap.registerPlugin(ScrollTrigger)

/**
 * The standing "there is more, and it is for sale" affordance.
 *
 * The page is a campaign: a pinned hero, a deck that deals itself, a collage
 * that turns over. Read cold it looks like something to watch rather than
 * something to buy, and a reader who does not scroll never reaches the
 * catalogue at all. This names what is under the fold and takes them to it.
 *
 * One fixed control rather than one planted at the foot of every section: the
 * sections are pinned, clipped and scrubbed, and an arrow inside any of them
 * would be carried off with whatever it was pinned to. Fixed, it is on screen
 * for the whole page and only has to know which stop is next.
 */
const STOPS = [
  { sel: '.episodes-runway', label: 'Shop the drop' },
  { sel: '.products', label: 'Shop the tees' },
  { sel: '.ground', label: 'The story' },
  { sel: '.lineup', label: 'Shop the line-up' },
  { sel: '.footer', label: 'Shop now' },
]

/**
 * How far down the window a section has to still be to count as "next". A
 * quarter, not the very top: a section whose head is already on screen has
 * arrived, and pointing back at it is how a cue like this ends up feeling
 * broken.
 */
const LINE = 0.25

export function ScrollCue() {
  const [at, setAt] = useState(0)

  useEffect(() => {
    /**
     * Five `getBoundingClientRect` calls. Rects rather than cached offsets
     * because this page grows after it lays out — fonts land late, posters and
     * athletes are fetched and injected — and an offset table measured at mount
     * is wrong by the time anyone scrolls past it.
     */
    const read = () => {
      const line = window.innerHeight * LINE
      const next = STOPS.findIndex((s) => {
        const el = document.querySelector(s.sel)
        return !!el && el.getBoundingClientRect().top > line
      })
      setAt((prev) => (prev === next ? prev : next))
    }

    /**
     * Driven by ScrollTrigger rather than by a `scroll` listener. Lenis owns
     * the page's scrolling and pumps ScrollTrigger itself (see
     * `useSmoothScroll`); a plain `window.addEventListener('scroll')` never
     * fired here at all, and the cue sat naming the first section for the whole
     * page. Riding the same pump also means one read per rendered frame, in
     * step with everything else that moves on this page.
     *
     * The trigger spans the document, so `onUpdate` covers all of it and
     * `onToggle` catches the two ends it stops short of.
     */
    const st = ScrollTrigger.create({
      trigger: document.documentElement,
      start: 'top top',
      end: 'bottom bottom',
      invalidateOnRefresh: true,
      onUpdate: read,
      onToggle: read,
      onRefresh: read,
    })

    read()
    return () => st.kill()
  }, [])

  // -1 is the foot of the page: nothing left below, so nothing to point at.
  const stop = at >= 0 ? STOPS[at] : undefined

  return (
    <button
      className="scrollcue"
      type="button"
      data-shown={stop ? '' : undefined}
      // Out of the tab order while it is invisible, or it is a focus stop that
      // scrolls the page to something the reader cannot see.
      tabIndex={stop ? undefined : -1}
      aria-hidden={stop ? undefined : true}
      onClick={() => {
        const el = stop && document.querySelector<HTMLElement>(stop.sel)
        if (el) scrollToSection(el)
      }}
    >
      {/* The visible label is the destination; the errand is only spoken. */}
      <span className="sr-only">Scroll to </span>
      <span className="scrollcue__label">{stop?.label ?? ''}</span>
      <svg className="scrollcue__arrow" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 4v13.5m0 0-6.2-6.2m6.2 6.2 6.2-6.2" />
      </svg>
    </button>
  )
}
