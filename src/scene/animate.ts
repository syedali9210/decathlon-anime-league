import gsap from 'gsap'
import { CSSPlugin } from 'gsap/CSSPlugin'

// The ESM build does not auto-register CSSPlugin, and `svgOrigin` lives in it.
gsap.registerPlugin(CSSPlugin)

/**
 * Character animation for the things in the scene that should be moving: the
 * two checkered flags, the two hanging banners, the cricket bat, and the
 * basketball.
 *
 * The traced artwork has no named sub-layers — the players are flat lists of
 * ~130 paths — so each moving part is declared here as a slice of its layer's
 * paths, verified at runtime against the bounding box it is supposed to have.
 * If the artwork is re-exported and the indices shift, `PARTS` fails loudly in
 * dev instead of silently animating an elbow.
 */

type Part = {
  layer: string
  /** [first, last] path index ranges within the layer's <svg>, inclusive. */
  ranges: [number, number][]
  /** Union bounding box the part must have, in artboard units: [x, y, w, h]. */
  expect: [number, number, number, number]
}

const PARTS = {
  ball: {
    layer: 'player-basketball',
    ranges: [[64, 83]],
    expect: [248, 532, 65, 68],
  },
  /** The dribbling forearm and hand, as one wedge from wrist to fingertips. */
  hand: {
    layer: 'player-basketball',
    ranges: [
      [31, 35],
      [125, 125],
    ],
    expect: [276, 503, 40, 45],
  },
  /**
   * Bat, both gloves and both forearms — everything outboard of the elbow, so
   * the bat swings with the arm instead of pivoting loose in the grip.
   */
  batArm: {
    layer: 'player-cricket',
    ranges: [
      [54, 66],
      [74, 82],
      [149, 171],
    ],
    expect: [1098, 446, 174, 142],
  },
} satisfies Record<string, Part>

/**
 * Where each banner hangs from, in artboard units, and which way it leads —
 * left and right mirror so the pair sway in opposition.
 *
 * These are **declared, not measured**, which is a step back from how the rest
 * of this file works and worth explaining. The banner art (Figma 252-1709) is a
 * Lottie export: its real geometry spans 1596x1101 and the 110x374 banner you
 * see is a clip out of it, so every bounding box in the layer — the paths', the
 * groups', all of them — reports that larger shape and none of them can tell you
 * where the cloth hangs.
 *
 * What is knowable is the placement, because we do it: each layer wraps the art
 * in `translate(x y)` at these coordinates and the banner is 110 wide, so the
 * fixing is `x + 55, y`. **If the translate in `assets/scene/banner-*.svg`
 * changes, change these with it** — nothing will warn.
 */
const BANNERS = [
  { layer: 'banner-left', pivot: '489 159', dir: 1 },
  { layer: 'banner-right', pivot: '1112 156', dir: -1 },
] as const

/** Ball spins about its own centre; the hand pivots at the wrist end of the wedge. */
const BALL_ORIGIN = '280.5 566'
const HAND_PIVOT = '318 505'

/** The batsman's elbow — near enough to the shoulder that the seam stays tight. */
const ELBOW_PIVOT = '1266 548'

/** One dribble push. Ball and hand share it so they read as one action. */
const DRIBBLE = 0.85

function resolve(root: HTMLElement, part: Part, name: string): SVGPathElement[] {
  const svg = root.querySelector(`[data-layer="${part.layer}"] svg`)
  if (!svg) return []
  const paths = [...svg.querySelectorAll('path')]
  const slice = part.ranges.flatMap(([a, b]) => paths.slice(a, b + 1))
  if (import.meta.env.DEV) verify(slice, part, name)
  return slice
}

/** Union bbox of the slice, compared with what the part table claims. */
function verify(slice: SVGPathElement[], part: Part, name: string) {
  if (!slice.length) return warn(name, 'resolved to no paths')
  let x0 = Infinity
  let y0 = Infinity
  let x1 = -Infinity
  let y1 = -Infinity
  for (const p of slice) {
    const b = p.getBBox()
    x0 = Math.min(x0, b.x)
    y0 = Math.min(y0, b.y)
    x1 = Math.max(x1, b.x + b.width)
    y1 = Math.max(y1, b.y + b.height)
  }
  const got = [x0, y0, x1 - x0, y1 - y0]
  if (got.some((v, i) => Math.abs(v - part.expect[i]) > 4)) {
    warn(name, `bbox drifted — expected ${part.expect}, got ${got.map(Math.round)}`)
  }
}

function warn(name: string, msg: string) {
  console.warn(
    `[scene] part "${name}" ${msg}. The artwork was probably re-exported; ` +
      `re-check the ranges in src/scene/animate.ts.`,
  )
}

/**
 * Each flag is a checkerboard of ~74 quads that tile edge to edge. Displacing
 * the quads individually — the obvious way to get a travelling wave — pulls the
 * tiling apart: neighbours land on slightly different phases and the grid reads
 * as scrambled rather than waving. So the cloth is flexed as a whole instead,
 * with three affine transforms about the pole on deliberately unequal periods:
 *
 *   rotate   the flag swinging on its pole
 *   skewY    the free end lifting and falling — the actual "wave"
 *   scaleX   the cloth furling as that wave runs out of it
 *
 * Affine, so the tiling can never break, and it is six tweens on two elements
 * rather than 148 animated paths.
 */
function wireFlagWave(root: HTMLElement) {
  const svg = root.querySelector('[data-layer="flags"] svg')
  if (!svg) return
  const cloths = [...svg.querySelectorAll('g')].filter(
    // Suffix, not equality: layer ids are namespaced on the way in, so these
    // arrive as `flags-Group 68`.
    (g) => g.id.endsWith('Group 68') || g.id.endsWith('Group 69'),
  )

  cloths.forEach((cloth, i) => {
    const b = cloth.getBBox()
    // The left flag hangs off a pole on its right, the right flag off its left,
    // so everything pivots on the opposite edge and the two mirror each other.
    const dir = i === 0 ? 1 : -1
    const svgOrigin = `${i === 0 ? b.x + b.width : b.x} ${b.y + b.height}`
    const loop = { repeat: -1, yoyo: true, ease: 'sine.inOut', svgOrigin }

    gsap.to(cloth, { ...loop, rotation: 1.5 * dir, duration: 3.7 })
    gsap.to(cloth, { ...loop, skewY: -2.8 * dir, duration: 1.9 })
    gsap.to(cloth, { ...loop, scaleX: 0.972, duration: 2.6 })
  })
}

/**
 * Both banners hang from a fixing above the top of the frame, so they are flexed
 * the same way the flags are — affine, about the point they hang from, never
 * per-path — with three periods that do not divide into each other:
 *
 *   skewX    the free end swinging out and back. This is the wave.
 *   rotate   the whole banner leaning on its fixing
 *   scaleX   the cloth furling as that wave runs down it
 *
 * The pivot is declared rather than measured — see BANNERS for why this one
 * export defeats measurement.
 */
function wireBannerWave(root: HTMLElement) {
  for (const { layer, pivot, dir } of BANNERS) {
    // The outer <g>; the positioning translate is on the <g> inside it, because
    // GSAP writes `transform` on its target and would overwrite it.
    const group = root.querySelector(`[data-layer="${layer}"] svg > g`)
    if (!group) continue

    const loop = { repeat: -1, yoyo: true, ease: 'sine.inOut', svgOrigin: pivot }

    gsap.to(group, { ...loop, skewX: 3.2 * dir, duration: 2.1 })
    gsap.to(group, { ...loop, rotation: 1.4 * dir, duration: 3.3 })
    gsap.to(group, { ...loop, scaleX: 0.968, duration: 2.7 })
  }
}

/**
 * The dribble is carried by the hand, not by the ball travelling: the hand
 * pushes down a few units at the wrist while the ball turns a little on its own
 * axis. Both run on one shared period so they read as a single action.
 */
function wireDribble(ball: SVGPathElement[], hand: SVGPathElement[]) {
  const loop = {
    duration: DRIBBLE,
    ease: 'sine.inOut',
    yoyo: true,
    repeat: -1,
  } as const

  if (ball.length) {
    gsap.to(ball, { ...loop, rotation: 16, svgOrigin: BALL_ORIGIN })
  }
  if (hand.length) {
    gsap.to(hand, { ...loop, y: 7, rotation: 3.5, svgOrigin: HAND_PIVOT })
  }
}

/** Cock back slowly, snap through, settle — then a beat before going again. */
function wireBatSwing(batArm: SVGPathElement[]) {
  if (!batArm.length) return

  // repeatDelay rather than a tween on {} for the beat between swings: an empty
  // object inherits svgOrigin from defaults and GSAP rightly rejects it.
  gsap
    .timeline({
      repeat: -1,
      repeatDelay: 0.45,
      defaults: { svgOrigin: ELBOW_PIVOT },
    })
    .to(batArm, { rotation: -8, duration: 0.8, ease: 'power2.inOut' })
    .to(batArm, { rotation: 5, duration: 0.2, ease: 'power3.out' })
    .to(batArm, { rotation: 0, duration: 0.55, ease: 'power1.inOut' })
}

/** Starts everything. Returns a teardown that reverts every tween it created. */
export function animateScene(root: HTMLElement): () => void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return () => {}
  }
  const ctx = gsap.context(() => {
    wireFlagWave(root)
    wireBannerWave(root)
    wireDribble(
      resolve(root, PARTS.ball, 'ball'),
      resolve(root, PARTS.hand, 'hand'),
    )
    wireBatSwing(resolve(root, PARTS.batArm, 'batArm'))
  }, root)
  return () => ctx.revert()
}
