import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import field from '../assets/footer/field.svg'
import gridSvg from '../assets/footer/grid.svg?raw'
import ticket from '../assets/footer/ticket.svg'
import ticketInner from '../assets/footer/ticket-inner.svg'
import ticketDot from '../assets/footer/ticket-dot.svg'
import burst from '../assets/footer/burst.svg'
import emblem from '../assets/footer/emblem.svg'
import racket from '../assets/footer/racket.webp'
import cricketball from '../assets/footer/cricketball.svg'
import cricketballSeam from '../assets/footer/cricketball-seam.svg'
import shuttle from '../assets/footer/shuttle.svg'
import football from '../assets/footer/football.svg'
import lockup from '../assets/footer/lockup.svg'

gsap.registerPlugin(ScrollTrigger)

/**
 * Two boards, one set of artwork.
 *
 * Figma 343-882 ("Desktop - 2") is 1440x689 landscape; 345-970 ("iPhone 17 - 3")
 * is 402x755 portrait. Both are pale pink with a tomato field, ruled into a
 * black grid, the league emblem in the middle, a ticket and a starburst that
 * carry words, and the collaboration lockup underneath — and the portrait board
 * re-uses every file the wide one does. It drops the racket and the shuttlecock,
 * rearranges the rest, stacks the lockup onto three lines, and crops a field
 * that is squashed and stretched to a different shape underneath it all.
 *
 * So there is one component and two sets of numbers.
 *
 * The numbers cannot live in a media query. Each piece is placed by custom
 * properties on its own `style` attribute, and an inline style beats every rule
 * in the stylesheet — a media query can never override it. Both sets are handed
 * down instead, `--x` and `--x-sm`, and the stylesheet picks which to read at
 * the breakpoint. The fallback chain means a piece with no portrait numbers
 * simply keeps its wide ones.
 *
 * Positions are percentages of whichever board is showing, as everywhere else
 * on this site, so one set of numbers holds at every width that board is shown
 * at.
 *
 * The rotated pieces are placed by their UNROTATED top-left and turned about
 * their own centre, which is not the number Figma reports. Figma gives the
 * axis-aligned bounding box of the turned artwork, and for the racket at -55deg
 * that box is 150x162 where the art is 135x90 — place by the box and the piece
 * lands in the wrong spot and at the wrong size. Each `x`/`y`/`w` below is the
 * art's own, recovered from the box: the box's centre is the art's centre, and
 * the art's size is what the box's own numbers resolve to once the turn is
 * taken back out. The portrait board reports its pieces against a frame that is
 * itself offset off the left edge, so those are unwound too.
 *
 * Every piece sits in a `.footer__pin` whose only job is position, with the
 * artwork inside it. That split is what lets the scroll drift below own the
 * wrapper's `transform` outright while the artwork keeps its own `rotate` and
 * the section reveal keeps its own `translate` — three owners, three
 * properties, nothing to arbitrate. Put the drift on a turned piece directly
 * and it travels along the piece's OWN axis rather than the screen's, which on
 * a racket lying at -55deg is a diagonal nobody asked for.
 */

/** Where a piece sits on the portrait board, when that differs. */
type Sm = { x: number; y: number; w: number }

/** A pinned piece: artwork, its unrotated top-left, its width, and its turn. */
const PIECES = [
  // Off the portrait board entirely — see the stylesheet, which hides them.
  { id: 'racket', src: racket, x: 21.73, y: 8.72, w: 9.37, r: -55.39 },
  // Two exports, one ball: the board draws the shell and its seam as separate
  // pieces and they are all but concentric. Kept apart rather than merged,
  // because merging them is a guess about paint order nothing here can check —
  // so they take the SAME drift below, or the seam slides off its own ball.
  {
    id: 'cricketball',
    src: cricketball,
    x: 73.61,
    y: 16.11,
    w: 6.27,
    sm: { x: 74.38, y: 10.33, w: 22.44 },
  },
  {
    id: 'cricketball-seam',
    src: cricketballSeam,
    x: 73.68,
    y: 16.31,
    w: 6.07,
    sm: { x: 74.63, y: 10.52, w: 21.74 },
  },
  // The board mirrors this one rather than turning it — its own x is the RIGHT
  // edge on the artboard, which is why the number here is not Figma's.
  { id: 'shuttle', src: shuttle, x: 90.63, y: 25.25, w: 5.2, flip: true },
  {
    id: 'football',
    src: football,
    x: 16.22,
    y: 38.42,
    w: 8.11,
    r: -82.45,
    sm: { x: 1.87, y: 47.25, w: 29.04 },
  },
] as const

/**
 * How far each piece of kit lags or leads the page, as a share of the scroll
 * the footer takes to cross the window. Signed: negative rides up against the
 * scroll, positive trails it.
 *
 * The KIT drifts and the stickers do not, which is the board's own logic rather
 * than a shortcut: the ticket and the starburst are stuck to the field and
 * should travel with its ruling, while the ball and the racket are lying over
 * it. Splitting them that way also means the two ticket vectors and their two
 * lines of type never have to be kept in step with one another.
 *
 * Small shares. The footer is short against sections more than twice its
 * height, so the number that reads as a lazy drift on the line-up is a lurch
 * here.
 */
const DRIFT: Record<string, number> = {
  racket: -0.05,
  cricketball: 0.04,
  'cricketball-seam': 0.04,
  shuttle: -0.055,
  football: 0.045,
}

const place = (x: number, y: number, w: number, sm?: Sm) =>
  ({
    '--x': `${x}%`,
    '--y': `${y}%`,
    '--w': `${w}%`,
    ...(sm
      ? { '--x-sm': `${sm.x}%`, '--y-sm': `${sm.y}%`, '--w-sm': `${sm.w}%` }
      : null),
  }) as React.CSSProperties

const turn = (r?: number) =>
  (r ? { '--r': `${r}deg` } : undefined) as React.CSSProperties | undefined

/**
 * A piece that is words rather than artwork.
 *
 * These are set live rather than baked into the sticker they sit on: they are
 * type, the page already loads the face the board names, and a phone renders
 * eleven-point type far better than it resamples a picture of it.
 *
 * Figma centres the turned text in its bounding box, so this places the box and
 * lets the type turn inside it — the same box-and-centre the artwork above
 * recovers by hand, except here the box is worth keeping, because the text's
 * own size is the browser's to decide and not the board's. The turn is the same
 * on both boards: it is the sticker's own lean, and the sticker is one drawing.
 */
const label = (
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  sm?: Sm & { h: number },
) =>
  ({
    '--x': `${x}%`,
    '--y': `${y}%`,
    '--w': `${w}%`,
    '--h': `${h}%`,
    '--r': `${r}deg`,
    ...(sm
      ? {
          '--x-sm': `${sm.x}%`,
          '--y-sm': `${sm.y}%`,
          '--w-sm': `${sm.w}%`,
          '--h-sm': `${sm.h}%`,
        }
      : null),
  }) as React.CSSProperties

/**
 * The ruling, in the DOM rather than behind an <img>, so its sixteen lines can
 * draw themselves on.
 *
 * `pathLength="1"` is the whole trick. The lines are three different real
 * lengths — 381 for most verticals, 388 for the one that runs to the foot, 1440
 * for the horizontals — and normalising every one to a length of 1 lets a
 * single `stroke-dasharray: 1; stroke-dashoffset: 1 -> 0` rule in the
 * stylesheet draw all sixteen correctly. Without it each line needs its own
 * dash figure, measured, and re-measured whenever the board is re-exported.
 *
 * The direction falls out of the path data for free: the verticals are written
 * `M44 3v381` so they draw downward, the horizontals `M0 77h1440` so they draw
 * out to the right.
 */
function useGrid(host: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const el = host.current
    if (!el || el.firstChild) return
    el.innerHTML = gridSvg
    const svg = el.querySelector('svg')
    if (!svg) return
    svg.removeAttribute('width')
    svg.removeAttribute('height')
    for (const p of svg.querySelectorAll('path')) p.setAttribute('pathLength', '1')
  }, [host])
}

/** The kit slides against the ruling over the footer's own pass. */
function useKitDrift(section: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = section.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const pass = () => el.offsetHeight + window.innerHeight
    const tweens = Object.entries(DRIFT).flatMap(([id, share]) => {
      const pin = el.querySelector<HTMLElement>(`.footer__pin[data-piece="${id}"]`)
      if (!pin) return []
      // Split either side of where the stylesheet puts it, so the excursion is
      // centred on the board's own position instead of running away from it.
      const half = () => (share * pass()) / 2
      return [
        gsap.fromTo(
          pin,
          { y: () => -half() },
          {
            y: () => half(),
            ease: 'none',
            scrollTrigger: {
              trigger: el,
              start: 'top bottom',
              end: 'bottom top',
              scrub: true,
              invalidateOnRefresh: true,
            },
          },
        ),
      ]
    })

    return () =>
      tweens.forEach((t) => {
        t.scrollTrigger?.kill()
        t.kill()
      })
  }, [section])
}

/** Position outside, artwork inside — see the note at the top of the file. */
function Pin({
  id,
  src,
  x,
  y,
  w,
  r,
  flip,
  alt,
  sm,
}: {
  id: string
  src: string
  x: number
  y: number
  w: number
  r?: number
  flip?: boolean
  alt?: string
  sm?: Sm
}) {
  return (
    <div className="footer__pin" data-piece={id} style={place(x, y, w, sm)}>
      <img
        className="footer__piece"
        style={turn(r)}
        data-flip={flip || undefined}
        src={src}
        alt={alt ?? ''}
        aria-hidden={alt ? undefined : true}
        loading="lazy"
        decoding="async"
      />
    </div>
  )
}

export function Footer() {
  const section = useRef<HTMLElement>(null)
  const grid = useRef<HTMLDivElement>(null)
  useGrid(grid)
  useKitDrift(section)

  return (
    <footer className="footer" ref={section}>
      <div className="footer__board">
        {/* The field and its ruling are two files at the same origin: the field
            carries the wavy edge top and bottom, the grid is drawn 13 units
            shorter so its lines stop inside the wave rather than crossing it.
            Both are placed entirely from the stylesheet, because neither has
            anything per-instance about it — see the media query for how the
            portrait board crops them. */}
        <img className="footer__field" src={field} alt="" aria-hidden="true" />
        <div className="footer__grid" aria-hidden="true" ref={grid} />

        {/* The ticket. Shape, inner rule, punch-hole and two lines of type. */}
        <Pin
          id="ticket"
          src={ticket}
          x={4.24}
          y={22.64}
          w={10.05}
          sm={{ x: 1.49, y: 8.74, w: 29.14 }}
        />
        <Pin
          id="ticket-inner"
          src={ticketInner}
          x={4.93}
          y={23.66}
          w={8.54}
          sm={{ x: 3.51, y: 9.49, w: 24.76 }}
        />
        <Pin
          id="ticket-dot"
          src={ticketDot}
          x={11.25}
          y={25.54}
          w={1.11}
          sm={{ x: 21.83, y: 10.89, w: 3.22 }}
        />
        {/* Two boxes rather than one two-line block: the board turns the lines
            by different amounts, which is what stops the sticker reading as a
            label printed straight. */}
        <p
          className="footer__label"
          data-label="choose"
          style={label(5.9, 24.82, 4.71, 5.62, -9.05, {
            x: 6.32,
            y: 11.43,
            w: 13.64,
            h: 4.15,
          })}
        >
          <span>Choose</span>
        </p>
        <p
          className="footer__label"
          data-label="league"
          style={label(5.28, 28.45, 7.86, 6.59, -8.77, {
            x: 4.51,
            y: 14.83,
            w: 22.78,
            h: 4.87,
          })}
        >
          <span>
            Your <em>League</em>
          </span>
        </p>

        {/* The starburst, and the only other words on the field. It is the one
            piece drawn at the same size on both boards. */}
        <Pin
          id="burst"
          src={burst}
          x={82.36}
          y={35.27}
          w={7.36}
          sm={{ x: 70.4, y: 43.44, w: 26.37 }}
        />
        <p
          className="footer__label footer__label--burst"
          data-label="burst"
          style={label(83.26, 37.3, 5.51, 11.39, 26.09, {
            x: 79.98,
            y: 45.3,
            w: 19.75,
            h: 10.39,
          })}
        >
          <span>
            special
            <br />
            edition
          </span>
        </p>

        {/* The one piece here that carries the campaign's name, so it is the
            one with an alt rather than an aria-hidden. */}
        <Pin
          id="emblem"
          src={emblem}
          x={40}
          y={11.18}
          w={19.93}
          alt="Anime Sports League"
          sm={{ x: 23.38, y: 20.93, w: 53.43 }}
        />

        {PIECES.map((p) => (
          <Pin
            key={p.id}
            id={p.id}
            src={p.src}
            x={p.x}
            y={p.y}
            w={p.w}
            r={'r' in p ? p.r : undefined}
            flip={'flip' in p ? p.flip : undefined}
            sm={'sm' in p ? p.sm : undefined}
          />
        ))}

        {/* Under the field, on the board's own pink. The wordmark is artwork and
            the two names are type, which is the board's own split — and it reads
            as one line either way: "Decathlon X Jolly Yun Shann". One row on the
            wide board, three stacked on the portrait one. */}
        <p className="footer__credit">
          <img className="footer__lockup" src={lockup} alt="Decathlon" />
          <span className="footer__x">X</span>
          <span className="footer__artist-name">Jolly Yun Shann</span>
        </p>
      </div>
    </footer>
  )
}
