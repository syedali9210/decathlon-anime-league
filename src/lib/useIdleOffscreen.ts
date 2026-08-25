import { useEffect } from 'react'

/**
 * Marks sections that have scrolled out of view, so their infinite CSS
 * animations stop.
 *
 * The frame's checker belt, the layer floats, the deck's bob and the floating
 * props all run forever. Off-screen that is pure waste — the compositor keeps
 * doing work for a section nobody is looking at, which is exactly the cost that
 * shows up as jank while scrolling somewhere else.
 *
 * A generous margin either side, so nothing is ever caught mid-resume as it
 * comes into view.
 */
export function useIdleOffscreen(selector: string) {
  useEffect(() => {
    const targets = [...document.querySelectorAll<HTMLElement>(selector)]
    if (!targets.length) return

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          ;(e.target as HTMLElement).toggleAttribute('data-idle', !e.isIntersecting)
        }
      },
      { rootMargin: '40% 0px' },
    )
    targets.forEach((t) => io.observe(t))

    return () => {
      io.disconnect()
      targets.forEach((t) => t.toggleAttribute('data-idle', false))
    }
  }, [selector])
}
