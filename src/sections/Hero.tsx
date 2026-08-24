import { useRef } from 'react'
import { Stage } from '../scene/Stage'
import { Frame } from '../scene/Frame'
import { Ball } from '../scene/Ball'
import { useParallax } from '../lib/useParallax'

export function Hero() {
  // The parallax numbers are written here rather than on the stage: the ball
  // reads --exit too, and it sits outside the stage's clip.
  const hero = useRef<HTMLElement>(null)
  useParallax(hero)

  return (
    // The runway is what --sy is measured against; the hero sticks to it.
    <div className="hero-runway" data-scroll-runway>
      <section className="hero" ref={hero}>
        {/* The wordmark is drawn inside the artwork — give it to assistive tech here. */}
        <h1 className="sr-only">Anime Sports League — Decathlon</h1>
        {/* Inset from the viewport by --frame-pad. The frame sits on this box's
            edge and the illustration is clipped to it, so everything lives
            inside the border rather than running under it. */}
        <div className="hero__stage">
          <Stage />
          <Frame />
        </div>
        {/* Outside that box, and after it, so it crosses over the border. */}
        <Ball />
      </section>
    </div>
  )
}
