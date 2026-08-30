import { useEffect, useState } from 'react'
import lockup from './assets/footer/lockup.svg'

/**
 * The Decathlon mark and wordmark, standing at the top left for the whole page.
 *
 * The same export the footer's credit uses — the mark and the word are one
 * drawing, so the logo and the name arrive together rather than being a picture
 * with a label typed beside it.
 *
 * On its own plate rather than laid straight on the page. The artwork is black,
 * and the page runs from ink at the hero through violet to the footer's pale
 * pink: there is no single colour a flat lockup could be and still be legible at
 * both ends of that ramp. The site's cream pill — the scroll cue's — carries it
 * at every point, and is the page's own furniture rather than a new idea.
 *
 * Held back until the hero's runway has scrolled past, which is exactly what the
 * Shop pill does and for the same reason: the hero is one full-bleed board and a
 * fixed mark over it sits on the artwork. Hidden it is also `pointer-events:
 * none`, `tabIndex -1` and `aria-hidden`, or it is an invisible click-catcher
 * over the hero and a focus stop that scrolls to nothing.
 *
 * Watched with an observer rather than a scroll trigger: this is one boolean
 * that flips once, and it does not need a position sampled every frame.
 */
export function BrandMark() {
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const hero = document.querySelector('.hero-runway')
    if (!hero) return

    const io = new IntersectionObserver(
      ([e]) => setShown(!e.isIntersecting),
      // No margin: the hero stops intersecting the moment its runway's foot
      // clears the top of the window, which is exactly "past the home page".
      { threshold: 0 },
    )
    io.observe(hero)
    return () => io.disconnect()
  }, [])

  return (
    <a
      className="brandmark"
      href="https://www.decathlon.in/"
      target="_blank"
      rel="noopener noreferrer"
      data-shown={shown || undefined}
      tabIndex={shown ? undefined : -1}
      aria-hidden={shown ? undefined : true}
    >
      {/* The alt is the name, because the name is IN the artwork — a reader
          hearing this gets "Decathlon" once, not "Decathlon logo Decathlon". */}
      <img src={lockup} alt="Decathlon" />
    </a>
  )
}
