import { useEffect, useRef, useState } from 'react'
import { COLLECTION } from './sections/shopLinks'

/**
 * Figma 337-873. The campaign's standing call to action: a pink pill that is
 * not there while the hero has the screen, and stays for the rest of the page
 * once it is.
 *
 * Held back rather than shown from the top because the hero is the whole first
 * screen — a fixed button over it would sit on the artwork it is there to sell,
 * and there is nothing to shop yet. It arrives when the hero's runway has
 * scrolled past, which is the same moment the episode relay takes over.
 *
 * Watched with an observer rather than a scroll trigger: this is one boolean
 * that flips once, and it does not need a position sampled every frame.
 */
export function ShopButton() {
  const [shown, setShown] = useState(false)
  const link = useRef<HTMLAnchorElement>(null)

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
      className="shopbtn"
      data-shown={shown || undefined}
      href={COLLECTION}
      target="_blank"
      rel="noopener noreferrer"
      ref={link}
      // Out of the tab order while it is invisible, or it is a focus stop that
      // scrolls the page to something the reader cannot see.
      tabIndex={shown ? undefined : -1}
      aria-hidden={shown ? undefined : true}
    >
      Shop
    </a>
  )
}
