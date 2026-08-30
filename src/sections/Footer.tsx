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
import avatar from '../assets/footer/avatar.webp'
import works from '../assets/footer/works.webp'

gsap.registerPlugin(ScrollTrigger)

/**
 * Two boards, one set of artwork.
 *
 * Figma 343-882 ("Desktop - 2") is 1440x689 landscape; 345-970 ("iPhone 17 - 3")
 * is 402x870 portrait. Both are pale pink with a tomato field, ruled into a
 * black grid, the league emblem in the middle, a ticket and a starburst that
 * carry words, and the artist credit underneath — and the portrait board re-uses
 * every file the wide one does.
 *
 * What differs is not just arrangement. The wide board drops the football and
 * keeps the racket and the shuttlecock; the portrait board does the exact
 * opposite. So "hidden here, shown there" runs both ways and both directions
 * live in the stylesheet.
 *
 * The credit is where the two boards diverge most. The wide one runs it as a
 * row — lockup, X, the artist's name with their trade under it, then their
 * portrait and a panel of their work. The portrait board stacks the same pieces
 * into a column and drops the work panel, and it puts the portrait BETWEEN the X
 * and the name rather than after them. That reordering is why the credit's
 * grouping elements collapse to `display: contents` at the breakpoint: the
 * groups the row needs are exactly what stops the column from interleaving.
 *
 * The numbers cannot live in a media query. Each piece is placed by custom
 * properties on its own `style` attribute, and an inline style beats every rule
 * in the stylesheet — a media query can never override it. Both sets are handed
 * down instead, `--x` and `--x-sm`, and the stylesheet picks which to read at
 * the breakpoint. The fallback chain means a piece with no portrait numbers
 * simply keeps its wide ones.
 *
 * The rotated pieces are placed by their UNROTATED top-left and turned about
 * their own centre, which is not the number Figma reports. Figma gives the
 * axis-aligned bounding box of the turned artwork, and for the racket at -55deg
 * that box is 150x162 where the art is 135x90 — place by the box and the piece
 * lands in the wrong spot and at the wrong size. Each `x`/`y`/`w` below is the
 * art's own, recovered from the box. The portrait board reports its pieces
 * against a frame that is itself offset off the left edge, so those are unwound
 * too.
 *
 * Every piece sits in a `.footer__pin` whose only job is position, with the
 * artwork inside it. That split is what lets the scroll drift below own the
 * wrapper's `transform` outright while the artwork keeps its own `rotate` and
 * the section reveal keeps its own `translate` — three owners, three
 * properties, nothing to arbitrate.
 */

/** Where a piece sits on the portrait board, when that differs. */
type Sm = { x: number; y: number; w: number }

/** A pinned piece: artwork, its unrotated top-left, its width, and its turn. */
const PIECES = [
  // Wide board only — the portrait board has no room for it.
  { id: 'racket', src: racket, x: 21.73, y: 6.11, w: 9.37, r: -55.39 },
  // Two exports, one ball: the board draws the shell and its seam as separate
  // pieces and they are all but concentric. Kept apart rather than merged,
  // because merging them is a guess about paint order nothing here can check —
  // so they take the SAME drift below, or the seam slides off its own ball.
  {
    id: 'cricketball',
    src: cricketball,
    x: 73.61,
    y: 13.5,
    w: 6.27,
    sm: { x: 74.38, y: 6.09, w: 22.44 },
  },
  {
    id: 'cricketball-seam',
    src: cricketballSeam,
    x: 73.68,
    y: 13.7,
    w: 6.07,
    sm: { x: 74.63, y: 6.25, w: 21.74 },
  },
  // The board mirrors this one rather than turning it — its own x is the RIGHT
  // edge on the artboard, which is why the number here is not Figma's. Wide
  // board only.
  { id: 'shuttle', src: shuttle, x: 90.63, y: 22.64, w: 5.2, flip: true },
  // The other way round: the football is on the PORTRAIT board only, so its
  // wide numbers are never used and the stylesheet hides it above the
  // breakpoint. Kept here rather than deleted because the two boards are one
  // component and the piece is one import.
  {
    id: 'football',
    src: football,
    x: 16.22,
    y: 38.42,
    w: 8.11,
    r: -82.45,
    sm: { x: 1.87, y: 38.14, w: 29.04 },
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
 * lets the type turn inside it. The turn is the same on both boards: it is the
 * sticker's own lean, and the sticker is one drawing.
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
 * stylesheet draw all sixteen correctly.
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
            Both are placed entirely from the stylesheet — see the media query
            for how the portrait board crops them. */}
        <img className="footer__field" src={field} alt="" aria-hidden="true" />
        <div className="footer__grid" aria-hidden="true" ref={grid} />

        {/* The ticket. Shape, inner rule, punch-hole and two lines of type. */}
        <Pin
          id="ticket"
          src={ticket}
          x={4.24}
          y={20.03}
          w={10.05}
          sm={{ x: 1.49, y: 4.71, w: 29.14 }}
        />
        <Pin
          id="ticket-inner"
          src={ticketInner}
          x={4.93}
          y={21.05}
          w={8.54}
          sm={{ x: 3.51, y: 5.36, w: 24.76 }}
        />
        <Pin
          id="ticket-dot"
          src={ticketDot}
          x={11.25}
          y={22.93}
          w={1.11}
          sm={{ x: 21.83, y: 6.57, w: 3.22 }}
        />
        {/* Two boxes rather than one two-line block: the board turns the lines
            by different amounts, which is what stops the sticker reading as a
            label printed straight. */}
        <p
          className="footer__label"
          data-label="choose"
          style={label(5.9, 23.67, 4.71, 5.62, -9.05, {
            x: 6.32,
            y: 7.05,
            w: 13.64,
            h: 3.6,
          })}
        >
          <span>Choose</span>
        </p>
        <p
          className="footer__label"
          data-label="league"
          style={label(5.28, 28.27, 7.86, 6.59, -8.77, {
            x: 4.51,
            y: 9.99,
            w: 22.78,
            h: 4.23,
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
          y={32.66}
          w={7.36}
          sm={{ x: 70.4, y: 34.83, w: 26.37 }}
        />
        <p
          className="footer__label footer__label--burst"
          data-label="burst"
          style={label(83.26, 34.69, 5.51, 11.39, 26.09, {
            x: 79.98,
            y: 36.44,
            w: 19.75,
            h: 9.02,
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
          y={8.56}
          w={19.93}
          alt="Anime Sports League"
          sm={{ x: 23.38, y: 15.29, w: 53.43 }}
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
            the names are type, which is the board's own split — and it reads as
            one line either way: "Decathlon X Jolly Yun Shann, illustrator and
            NFT artist".
            `.footer__lockline` and `.footer__names` exist only to group the row;
            on the portrait board they collapse to `display: contents` so the
            portrait can sit between the X and the name. */}
        <div className="footer__credit">
          <div className="footer__lockline">
            <img className="footer__lockup" src={lockup} alt="Decathlon" />
            <span className="footer__x">X</span>
            <span className="footer__names">
              <span className="footer__artist-name">Jolly Yun Shann</span>
              <span className="footer__artist-role">
                (Illustrator and NFT artist)
              </span>
            </span>
          </div>

          {/* The artist, and a panel of their work. The portrait is decoration
              beside a name that is already written; the panel is the work
              itself, so that one keeps a description. */}
          <img
            className="footer__avatar"
            src={avatar}
            alt=""
            aria-hidden="true"
            loading="lazy"
            decoding="async"
          />
          <img
            className="footer__works"
            src={works}
            alt="A selection of Jolly Yun Shann's illustration work"
            loading="lazy"
            decoding="async"
          />
        </div>
      </div>
    </footer>
  )
}
