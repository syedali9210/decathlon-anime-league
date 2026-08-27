import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/**
 * The moving parts of the ground collage. Some belong to every character — the
 * floor runs under all of them — and some are one board's own, so what is wired
 * depends on which character the collage is showing.
 *
 * All of them are loops, so all of them are linear: an eased loop reads as a
 * pulse, because the slow end of the ease lands in the middle of the picture
 * instead of at a boundary. Nothing here animates anything but a transform.
 *
 * Everything is paused while the section is off screen — see the trigger at the
 * foot of the file. The CSS `[data-idle]` rule only reaches CSS animations, and
 * sixty paths turning behind a page nobody is looking at is exactly the cost
 * that shows up as jank somewhere else.
 */

/* ── the two balls ───────────────────────────────────────────────────────── */

/**
 * The ball's own colours — cream shell, green panels. The net it lands in is
 * `#d33a7a` and has to stay put while the ball turns inside it, which is the
 * whole reason this is a colour test and not "everything in that corner".
 */
const BALL_FILLS = ['#f1f1e2', '#00b663']

type BallSpec = {
  /** Region in the striker's own user units; a path joins if its centre is inside. */
  box: [number, number, number, number]
  /** Seconds per turn. Negative turns anticlockwise. */
  spin: number
}

/**
 * Per character, in that character's own artwork units.
 *
 * Picked out by region rather than by index, because the balls are not
 * contiguous in the export — the struck ball's green panels sit twenty paths
 * away from its shell, with the player's body in between. The boxes are the
 * balls' own bounds off the board with a few units of slack; the fill test
 * drops the boot tip and the speed lines that fall inside the first one.
 *
 * sky-smash has no entry: a shuttle does not roll, and nothing else on that
 * board turns. Its motion is the floor and the idle bob until there is a brief
 * for more.
 */
const BALLS: Record<string, BallSpec[]> = {
  'apex-kick': [
    // Struck, top left, speed lines trailing behind it. Anticlockwise, because
    // that is forward roll for something travelling left, and fast — it has
    // just been hit.
    { box: [112, -5, 198, 82], spin: -1.15 },
    // Settling in the net at the foot of the collage: slower, and the other way.
    { box: [70, 285, 180, 392], spin: 2.9 },
  ],
}

function centreIn(el: SVGGraphicsElement, [x0, y0, x1, y1]: BallSpec['box']) {
  const b = el.getBBox()
  const cx = b.x + b.width / 2
  const cy = b.y + b.height / 2
  return cx >= x0 && cx <= x1 && cy >= y0 && cy <= y1
}

function union(els: SVGGraphicsElement[]) {
  let x0 = Infinity
  let y0 = Infinity
  let x1 = -Infinity
  let y1 = -Infinity
  for (const e of els) {
    const b = e.getBBox()
    x0 = Math.min(x0, b.x)
    y0 = Math.min(y0, b.y)
    x1 = Math.max(x1, b.x + b.width)
    y1 = Math.max(y1, b.y + b.height)
  }
  return { cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 }
}

function spinBalls(svg: SVGSVGElement, character: string, out: gsap.core.Tween[]) {
  const paths = [...svg.querySelectorAll<SVGPathElement>('path')]

  for (const spec of BALLS[character] ?? []) {
    const ball = paths.filter(
      (p) =>
        BALL_FILLS.includes(p.getAttribute('fill') ?? '') && centreIn(p, spec.box),
    )
    if (import.meta.env.DEV && ball.length < 8) {
      console.warn(
        `[ground] only ${ball.length} paths matched ${character}'s ball at ` +
          `${spec.box}. The art was probably re-exported; re-check ` +
          'src/sections/groundMotion.ts.',
      )
    }
    if (!ball.length) continue

    // Turned as separate paths rather than wrapped in one <g>: the net's strands
    // are drawn between the ball's shell and its panels, and collecting the two
    // into a group would move the net in front of the panels.
    const { cx, cy } = union(ball)
    out.push(
      gsap.to(ball, {
        rotation: spec.spin > 0 ? 360 : -360,
        duration: Math.abs(spec.spin),
        ease: 'none',
        repeat: -1,
        svgOrigin: `${cx} ${cy}`,
      }),
    )
  }
}

/* ── the floor ───────────────────────────────────────────────────────────── */

/** Seconds for a rung to travel one slot down the grid. */
const FLOOR_STEP = 1.15

type Slot = { y: number; cx: number; w: number }

/**
 * The trapezoid's own top and bottom edges, off `Rectangle 50` —
 * `m405.19.5 119 242.5H.88L141.79.5z`. They are the two slots either end of the
 * seven drawn rungs, and using them is what makes the loop seamless: a rung
 * arriving at the bottom lies exactly on the edge already drawn there, so it
 * vanishes into it at the same moment a new one leaves the top edge. Seven rungs
 * are visible at every point of the cycle, and the reset at the end of it
 * reproduces the opening frame exactly.
 */
const TOP: Slot = { y: 0.5, cx: 273.49, w: 263.4 }
const BOTTOM: Slot = { y: 243, cx: 262.44, w: 523.12 }

function slotOf(el: SVGGraphicsElement): Slot {
  const b = el.getBBox()
  return { y: b.y + b.height / 2, cx: b.x + b.width / 2, w: b.width }
}

/**
 * The rungs step down the grid and widen as they come, which is the whole of the
 * effect — the rails they run between never move, because the direction of
 * travel is what they describe.
 *
 * Found by shape, not by id: a rung is the only thing in this drawing that is
 * wide, flat and sits below the top edge. The rails are 243 tall — except the
 * mirrored half, which carry their own `transform` and so measure flat too,
 * `getBBox` being blind to an element's own transform. Those are the ones the
 * `y` test drops: they all report a box at y -0.5, above anything drawn.
 *
 * Deliberately NOT `:not([transform])`, which was the obvious way to drop them
 * and is wrong: GSAP writes a transform attribute, so the second time this ran
 * — StrictMode invokes effects twice — the selector matched nothing and the
 * floor silently stopped. Every test here reads only what the file itself says,
 * so running it again on elements it has already touched gives the same answer.
 */
function runFloor(svg: SVGSVGElement, out: gsap.core.Tween[]) {
  const rungs = [...svg.querySelectorAll<SVGPathElement>('path:not([data-spare="1"])')]
    .filter((p) => {
      const b = p.getBBox()
      return b.height <= 6 && b.width >= 200 && b.y > 5
    })
    .sort((a, b) => a.getBBox().y - b.getBBox().y)

  if (rungs.length < 2) return () => {}

  const slots: Slot[] = [TOP, ...rungs.map(slotOf), BOTTOM]

  // One spare rung rides the slot above the first, so there is always one
  // arriving out of the top edge as the last reaches the bottom.
  const spare = rungs[0].cloneNode(true) as SVGPathElement
  spare.removeAttribute('id')
  spare.setAttribute('data-spare', '1')
  rungs[0].parentNode?.insertBefore(spare, rungs[0])

  /**
   * Maps the element onto `to`, starting from `from`. `base` is the geometry the
   * element actually has in the file, which both ends are expressed against —
   * scaling about its own centre sets the width, translating afterwards puts
   * that centre on the slot.
   */
  const step = (el: Element, from: Slot, to: Slot, base: Slot) => {
    const svgOrigin = `${base.cx} ${base.y}`
    return gsap.fromTo(
      el,
      { x: from.cx - base.cx, y: from.y - base.y, scaleX: from.w / base.w, svgOrigin },
      {
        x: to.cx - base.cx,
        y: to.y - base.y,
        scaleX: to.w / base.w,
        svgOrigin,
        duration: FLOOR_STEP,
        ease: 'none',
        repeat: -1,
      },
    )
  }

  // The spare's own geometry is the first rung's, so it steps from the edge above it.
  out.push(step(spare, slots[0], slots[1], slots[1]))
  rungs.forEach((r, i) => out.push(step(r, slots[i + 1], slots[i + 2], slots[i + 1])))

  return () => spare.remove()
}

/* ── the disc's rim ──────────────────────────────────────────────────────── */

/** Seconds for a mark to travel one place along the rim. */
const RIM_STEP = 0.28

type Point = { x: number; y: number }

/**
 * The green half-disc at the foot of the collage carries eighteen short white
 * marks hatched across the black band on its lower-right edge — Figma 282-7416,
 * `Line 35` and up. They chase each other around the rim, top right to bottom
 * left, each stepping into the place the next one holds.
 *
 * Translated, not turned about the disc's centre: the marks all sit at roughly
 * the same angle wherever they are on the curve rather than standing radially
 * off it, so rotating them would stand them up as they travelled.
 *
 * Ordered by their y, which along this arc is the rim order — the curve only
 * ever descends from the first mark to the last, so no centre is needed to sort
 * them and none is hard-coded.
 *
 * The fades at either end belong to the PLACES, not to the marks: whichever
 * element is arriving at the first place fades in, whichever is leaving the last
 * fades out. Tie a fade to a particular mark instead and the cycle blinks every
 * time it restarts.
 */
function runRimTicks(svg: SVGSVGElement, out: gsap.core.Tween[]) {
  // The sector is filled, not stroked, so the marks are the only stroked paths.
  const marks = [...svg.querySelectorAll<SVGPathElement>('path[stroke]')].sort(
    (a, b) => a.getBBox().y - b.getBBox().y,
  )
  if (marks.length < 3) return () => {}

  const centre = (el: SVGGraphicsElement): Point => {
    const b = el.getBBox()
    return { x: b.x + b.width / 2, y: b.y + b.height / 2 }
  }
  const places = marks.map(centre)

  // One place either end of the run, carrying on the spacing at that end.
  const beyond = (a: Point, b: Point): Point => ({ x: 2 * a.x - b.x, y: 2 * a.y - b.y })
  const slots: Point[] = [
    beyond(places[0], places[1]),
    ...places,
    beyond(places[places.length - 1], places[places.length - 2]),
  ]
  const last = slots.length - 1

  // A spare holds the place above the first mark, so one is always arriving.
  const spare = marks[0].cloneNode(true) as SVGPathElement
  spare.removeAttribute('id')
  spare.setAttribute('data-spare', '1')
  marks[0].parentNode?.insertBefore(spare, marks[0])

  const run = (el: Element, i: number, base: Point) =>
    gsap.fromTo(
      el,
      { x: slots[i].x - base.x, y: slots[i].y - base.y, opacity: i === 0 ? 0 : 1 },
      {
        x: slots[i + 1].x - base.x,
        y: slots[i + 1].y - base.y,
        opacity: i + 1 === last ? 0 : 1,
        duration: RIM_STEP,
        ease: 'none',
        repeat: -1,
      },
    )

  // The spare's own geometry is the first mark's, so it runs from the place above it.
  out.push(run(spare, 0, places[0]))
  marks.forEach((m, i) => out.push(run(m, i + 1, places[i])))

  return () => spare.remove()
}

/* ── wiring ──────────────────────────────────────────────────────────────── */

/**
 * `root` is one character's `.ground__art`, and it names the character it is
 * showing — which is how the pieces that belong to one board and not another
 * are wired only where they exist.
 *
 * The athlete is fetched and injected after mount, so the balls are wired on the
 * `svgready` its host fires rather than on the first pass.
 */
export function animateGround(root: HTMLElement): () => void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {}

  const character = root.dataset.character ?? ''
  const tweens: gsap.core.Tween[] = []
  const drop: Array<() => void> = []

  const ctx = gsap.context(() => {
    const pitch = root.querySelector<SVGSVGElement>('.ground__pitch svg')
    if (pitch) drop.push(runFloor(pitch, tweens))

    const disc = root.querySelector<SVGSVGElement>(
      '.ground__trinket[data-trinket="disc"] svg',
    )
    if (disc) drop.push(runRimTicks(disc, tweens))
  }, root)

  const onReady = () => {
    const player = root.querySelector<SVGSVGElement>('.ground__player svg')
    if (player) ctx.add(() => spinBalls(player, character, tweens))
  }
  root.addEventListener('svgready', onReady)
  onReady() // in case it landed before this ran

  // Nothing turns while the section is off screen.
  const st = ScrollTrigger.create({
    trigger: root,
    start: 'top bottom',
    end: 'bottom top',
    onToggle: (self) =>
      tweens.forEach((t) => (self.isActive ? t.play() : t.pause())),
  })

  return () => {
    root.removeEventListener('svgready', onReady)
    st.kill()
    ctx.revert()
    drop.forEach((fn) => fn())
  }
}

// `svgready` is a plain Event on a div; React's typings do not need to know
// about it, but TypeScript does when it is dispatched.
declare global {
  interface HTMLElementEventMap {
    svgready: Event
  }
}
