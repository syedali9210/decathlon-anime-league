import gsap from 'gsap'
import { CSSPlugin } from 'gsap/CSSPlugin'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(CSSPlugin, ScrollTrigger)

/**
 * The flaming props: the four that float over the product grid, and the cricket
 * ball that flies into the hero as it scrolls away (Figma 198-156311, which is
 * the same artwork — see `heroball`).
 *
 * Each prop is a ball and a trail of flame vectors, and **only the ball turns**.
 * The flames are part of the drawing, not a separate effect.
 *
 * They used to flicker — every flame vector on its own clock, scaled and rotated
 * about the ball's centre. On traced artwork that pulled the trail apart: the
 * flame is dozens of separate shapes that read as one mass only while they hold
 * their relative positions, so animating them individually scattered them. Hence
 * `flicker: false` on all of them; the option remains for artwork whose flame is
 * a single shape.
 *
 * The bob and its ground shadow are CSS on the <svg> and a pseudo-element (see
 * index.css) — GSAP owns the host's transform for the scroll drift, so the two
 * never write the same property.
 *
 * `ball` lists the path indices that make up the ball — the rest of the file is
 * flame. Only the cricket ball falls on a colour-group boundary. On the other
 * three the trace put ball and flame in the SAME group, because the ball's own
 * markings are drawn in the flame's colour: the football's seams are the pink
 * of its flame, the shuttlecock's skirt the orange of its own, the tennis
 * ball's seam the yellow of its. A group is therefore not a set, and every
 * range here was read off the artwork path by path rather than taken from one.
 *
 * Verified by isolating each index in the browser and looking at it — which is
 * the only way to get these right, and the way the two that were wrong were
 * found: the football was spinning its body out from under its own seams, and
 * the shuttlecock was carrying a lick of flame round with it.
 */
type PropSpec = {
  ball: number[]
  /** Seconds per turn. Signed: negative spins anticlockwise. */
  spin: number
  /** How far the prop drifts across the section's scroll, in px. Omit for none. */
  drift?: number
  /** Flames flicker unless this is false. The hero's ball turns and nothing else. */
  flicker?: boolean
}

const r = (a: number, b: number) =>
  Array.from({ length: b - a + 1 }, (_, i) => a + i)

export const PROPS: Record<string, PropSpec> = {
  /**
   * 0-8 is the cream body; 9-13 are the pink panel seams drawn ON it, and they
   * are the ball as much as the body is. They used to be left with the flame —
   * the whole pink group was — so the body turned and the seams stayed put, and
   * the ball read as two things sliding over each other. 14-15 are the pink
   * flame that group also holds, and those do stay.
   */
  football: { ball: r(0, 13), spin: 13, drift: -70, flicker: false },
  cricketball: { ball: r(0, 8), spin: -9.5, drift: 52, flicker: false },
  /**
   * 11-21 is skirt and cork. 22 is a lick of flame that happens to be drawn
   * with them, and including it did two things: it dragged that flame round in
   * a circle, and — because the pivot is the set's own centre — it pulled the
   * pivot off the shuttlecock and out toward the flame, so the shuttle orbited
   * a point beside itself instead of turning on the spot.
   */
  shuttle: { ball: r(11, 21), spin: 17, drift: -44, flicker: false },
  tennisball: { ball: [2, 3, 4, 13, 14], spin: -11, drift: 64, flicker: false },
  /**
   * The hero's crossing ball — its own artwork (Figma 199-156312), not the
   * traced prop above. One slow turn every 12s and nothing else moving: the
   * flames are part of the drawing, not a separate effect, and its travel is
   * the hero's `--ball`, not a drift here.
   */
  heroball: { ball: r(0, 8), spin: -12, flicker: false },
}

function union(paths: SVGPathElement[]) {
  let x0 = Infinity
  let y0 = Infinity
  let x1 = -Infinity
  let y1 = -Infinity
  for (const p of paths) {
    const b = p.getBBox()
    x0 = Math.min(x0, b.x)
    y0 = Math.min(y0, b.y)
    x1 = Math.max(x1, b.x + b.width)
    y1 = Math.max(y1, b.y + b.height)
  }
  return { cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, w: x1 - x0, h: y1 - y0 }
}

/**
 * Wires one prop. `scroller` is the element whose scroll range the drift is
 * measured against; omit it for a prop whose travel is driven elsewhere.
 * Returns a teardown.
 */
export function animateProp(
  svg: SVGSVGElement,
  id: string,
  scroller?: Element,
): () => void {
  const spec = PROPS[id]
  if (!spec) return () => {}
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {}

  const all = [...svg.querySelectorAll('path')] as SVGPathElement[]
  const ball = spec.ball.map((i) => all[i]).filter(Boolean)
  const flames = all.filter((_, i) => !spec.ball.includes(i))

  if (import.meta.env.DEV && ball.length !== spec.ball.length) {
    console.warn(
      `[props] "${id}" resolved ${ball.length} of ${spec.ball.length} ball ` +
        `paths. The prop was probably re-exported; re-check src/sections/propMotion.ts.`,
    )
  }
  if (!ball.length) return () => {}

  // Everything pivots on the ball, including the flames — that is what makes
  // them read as attached to it rather than as a separate shape.
  const { cx, cy, w } = union(ball)
  const svgOrigin = `${cx} ${cy}`

  const ctx = gsap.context(() => {
    gsap.to(ball, {
      rotation: spec.spin > 0 ? 360 : -360,
      duration: Math.abs(spec.spin),
      ease: 'none',
      repeat: -1,
      svgOrigin,
    })

    if (spec.flicker !== false) {
      // Per-flame flicker on its own clock, so the trail never pulses as one mass.
      const rand = gsap.utils.random
      flames.forEach((f) => {
        const dur = rand(0.36, 0.82)
        gsap.to(f, {
          scale: rand(1.08, 1.22),
          rotation: rand(-5.5, 5.5),
          opacity: rand(0.74, 1),
          duration: dur,
          delay: rand(0, dur),
          ease: 'sine.inOut',
          yoyo: true,
          repeat: -1,
          svgOrigin,
        })
      })

      // A slow lean of the whole flame trail, so the flicker sits on top of
      // something moving rather than jittering in place.
      gsap.to(flames, {
        x: w * 0.03,
        duration: 2.6,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
        svgOrigin,
      })
    }

    // "just a little scroll effect" — the props ride past the cards.
    if (scroller && spec.drift) {
      gsap.to(svg.parentElement, {
        y: spec.drift,
        ease: 'none',
        scrollTrigger: {
          trigger: scroller,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      })
    }
  }, svg)

  return () => ctx.revert()
}
