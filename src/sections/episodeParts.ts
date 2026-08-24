import gsap from 'gsap'
import { CSSPlugin } from 'gsap/CSSPlugin'

// The ESM build does not auto-register CSSPlugin, and `svgOrigin` lives in it.
gsap.registerPlugin(CSSPlugin)

/**
 * The one prop in each card that moves.
 *
 * These posters are traced comic art: no semantic groups, and shapes get merged
 * with whatever shares their fill — the cricket bat is a single path, while the
 * tennis racket is 22 scattered ones. So each prop is an explicit list of path
 * indices, found by isolating candidates in the browser and looking at them,
 * guarded by the union bounding box it must have. A re-export that shifts the
 * order warns in dev instead of silently animating a shoe.
 *
 * Coordinates are the artboard's, which each card SVG keeps as its viewBox.
 */
export type EpisodePart = {
  indices: number[]
  /** Union bbox the indices must resolve to: [x0, y0, x1, y1]. */
  expect: [number, number, number, number]
  /** Rotation centre — the grip for a racket or bat, the middle for a ball. */
  pivot: [number, number]
  motion: 'swing' | 'spin'
}

export const EPISODE_PARTS: Record<string, EpisodePart> = {
  'spin-ignite': {
    indices: [
      12, 133, 151, 154, 165, 166, 176, 180, 181, 192, 383, 397, 398, 399, 400,
      401, 402, 403, 427, 433, 494, 501,
    ],
    expect: [215.3, 533.1, 254.8, 602.2],
    pivot: [233, 599],
    motion: 'swing',
  },
  'sky-smash': {
    indices: [
      33, 34, 35, 36, 38, 42, 43, 46, 56, 57, 59, 74, 76, 85, 99, 107, 121, 132,
      136, 152, 160, 161, 163, 164, 167, 170, 225, 228, 232, 238, 240, 273, 274,
      275, 276, 277, 278, 279, 280, 281, 282, 283, 284, 285, 286, 292, 311, 375,
    ],
    expect: [424.8, 513.5, 478, 587.3],
    pivot: [430, 583],
    motion: 'swing',
  },
  'crick-stryke': {
    indices: [958],
    expect: [834.1, 499, 896, 567.4],
    pivot: [838, 566],
    motion: 'swing',
  },
  'rim-crush': {
    indices: [39, 73, 106, 108, 141, 213],
    expect: [1387.5, 521.9, 1409.4, 544.6],
    pivot: [1398.5, 533.3],
    motion: 'spin',
  },
}

function warn(card: string, msg: string) {
  console.warn(
    `[episodes] part for "${card}" ${msg}. The card art was probably ` +
      `re-exported; re-check the indices in src/sections/episodeParts.ts.`,
  )
}

function resolve(svg: SVGSVGElement, card: string, part: EpisodePart) {
  const all = svg.querySelectorAll('path')
  const paths = part.indices.map((i) => all[i]).filter(Boolean) as SVGPathElement[]

  if (import.meta.env.DEV) {
    if (paths.length !== part.indices.length) {
      warn(card, `resolved ${paths.length} of ${part.indices.length} paths`)
    } else {
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
      const got = [x0, y0, x1, y1]
      if (got.some((v, i) => Math.abs(v - part.expect[i]) > 3)) {
        warn(card, `bbox drifted — expected ${part.expect}, got ${got.map(Math.round)}`)
      }
    }
  }
  return paths
}

/** Wires the one moving prop in a card. Returns a teardown. */
export function animateCard(svg: SVGSVGElement, card: string): () => void {
  const part = EPISODE_PARTS[card]
  if (!part) return () => {}
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {}

  const paths = resolve(svg, card, part)
  if (!paths.length) return () => {}

  const svgOrigin = `${part.pivot[0]} ${part.pivot[1]}`
  const ctx = gsap.context(() => {
    if (part.motion === 'swing') {
      // Load up slowly, snap through, settle, then a beat — the same shape as
      // the hero's bat, scaled down because these props are only ~60px tall.
      gsap
        .timeline({ repeat: -1, repeatDelay: 1.1, defaults: { svgOrigin } })
        .to(paths, { rotation: -7, duration: 0.9, ease: 'power2.inOut' })
        .to(paths, { rotation: 4, duration: 0.18, ease: 'power3.out' })
        .to(paths, { rotation: 0, duration: 0.6, ease: 'power1.inOut' })
    } else {
      gsap.to(paths, {
        rotation: 360,
        duration: 7,
        ease: 'none',
        repeat: -1,
        svgOrigin,
      })
      gsap.to(paths, {
        y: -2.5,
        duration: 1.4,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
        svgOrigin,
      })
    }
  }, svg)

  return () => ctx.revert()
}
