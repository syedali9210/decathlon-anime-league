import { useEffect, useRef } from 'react'
import { namespaceIds } from '../lib/inlineSvg'
import { animateProp } from '../sections/propMotion'
// Figma 199-156312. A redraw of the flaming cricket ball — flatter and far
// fewer shapes than the traced prop the product grid floats, which this
// replaced.
import ballSvg from '../assets/scene/ball.svg?raw'

/**
 * The handover into the section below: as the hero's scene parts, the ball
 * crosses the screen from left to right — over the border, not behind it —
 * turning slowly on its own axis, and is gone by the time the hero unpins.
 *
 * It lives outside `.hero__stage` for exactly that reason: that box is the
 * frame's own clip, and anything inside it is cut at the rail. Here it is cut
 * at the viewport instead, so it flies in from off-screen and passes over the
 * border rather than appearing at its edge. The travel is `--exit` in CSS; this
 * only wires the spin and the flicker.
 */
export function Ball() {
  const host = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const node = host.current?.querySelector('svg')
    if (!node) return
    node.removeAttribute('width')
    node.removeAttribute('height')
    return animateProp(node, 'heroball')
  }, [])

  return (
    <div
      className="hero__ball"
      ref={host}
      aria-hidden="true"
      // Namespaced like every other inlined export: it shares generated def ids
      // with the hero's own layers.
      dangerouslySetInnerHTML={{ __html: namespaceIds(ballSvg, 'heroball-') }}
    />
  )
}
