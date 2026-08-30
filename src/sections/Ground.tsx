import { useEffect, useRef, useState } from 'react'
import sun from '../assets/ground/sun.svg?raw'
import pitch from '../assets/ground/pitch.svg?raw'

import apexPlayer from '../assets/ground/apex-kick/player.svg'
import apexDisc from '../assets/ground/apex-kick/disc.svg?raw'
import apexPhoto from '../assets/ground/apex-kick/photo.webp'

import smashPlayer from '../assets/ground/sky-smash/player.svg'
import smashShuttle from '../assets/ground/sky-smash/shuttle.svg'
import smashBolt from '../assets/ground/sky-smash/bolt.svg'
import smashTagPink from '../assets/ground/sky-smash/tag-pink.svg'
import smashTagGreen from '../assets/ground/sky-smash/tag-green.svg'

import crickPlayer from '../assets/ground/crick-stryke/player.svg'
import crickBall from '../assets/ground/crick-stryke/ball.svg'
import crickSpark from '../assets/ground/crick-stryke/spark.svg'
import crickHelmet from '../assets/ground/crick-stryke/helmet.webp'
import crickBolt from '../assets/ground/crick-stryke/bolt.svg?raw'
import crickCrescent from '../assets/ground/crick-stryke/crescent.svg'

import spinPlayer from '../assets/ground/spin-ignite/player.svg'
import spinBall from '../assets/ground/spin-ignite/ball.svg'
import spinSpark from '../assets/ground/spin-ignite/spark.svg'
import spinOrb from '../assets/ground/spin-ignite/orb.svg'
import spinOrbA from '../assets/ground/spin-ignite/orb-a.svg'
import spinOrbB from '../assets/ground/spin-ignite/orb-b.svg'
import spinOrbC from '../assets/ground/spin-ignite/orb-c.svg'
import spinRacket from '../assets/ground/spin-ignite/racket.webp'

// Three of the four shots came out of the boards at the resolution the
// catalogue already ships, so those are the catalogue's own files rather than
// second copies of them. Only the football board had an original — 1107px —
// worth re-exporting at this scale.
import smashPhoto from '../assets/products/sky-smash.webp'
import crickPhoto from '../assets/products/crick-stryke.webp'
import spinPhoto from '../assets/products/spin-ignite.webp'

import { namespaceIds } from '../lib/inlineSvg'
import { animateGround } from './groundMotion'

/**
 * Figma 271-5, 271-5067, 274-5704 and 275-6573. Two columns on a 1596 artboard:
 * the claim on the left, and on the right a collage that changes character —
 * the same frame, the same slatted sun and pitch grid, a different athlete on
 * it.
 *
 * The claim is the campaign line and holds for every character, so it does not
 * move; only the collage is swapped. All four boards put their frame at exactly
 * (524, 232) and size it 976x918, which is what makes that a swap rather than
 * four screens.
 */
/**
 * The campaign's own words. Real copy, not artwork — it is the only prose in
 * this section, so it is a plain paragraph and stays in the accessibility tree.
 */
const COPY = (
  <>
    Anime and sports share the same beating heart: the thrilling journey of
    pushing past your limits to unleash an unbelievable, game-changing power. We
    bring that shonen energy to the field, because{' '}
    <em>every athlete is the main character of their own story</em>, and every
    match is your chance to pull off the impossible.
  </>
)

const CLAIM = [
  'From the',
  'First step',
  'To the',
  'Final whistle',
  'The ground',
  'Is yours',
]

/**
 * A piece one board has and the others do not. Positions are percentages of the
 * 976x918 frame, straight off the board.
 *
 * These live here rather than in the stylesheet — where the five pieces every
 * board HAS do live — because the list is a different length and shape for each
 * character, and splitting seventeen of them across two files by id would mean
 * every new character is edited in two places. The five fixed pieces are a
 * schema and belong in CSS; these are data.
 */
type Trinket = {
  id: string
  /**
   * Omitted for the pieces with no artwork behind an <img>: the one a board
   * draws as a plain black bar, and the ones inlined below.
   */
  src?: string
  /**
   * Artwork put in the DOM instead of behind an <img>, for a piece something
   * inside of which moves — the football board's disc and the cricket board's
   * bolt both carry hatch marks that chase along them. Namespaced at the point
   * of use, like every other inlined export here.
   */
  svg?: string
  x: number
  y: number
  w: number
  /** Only where there is no artwork to take an intrinsic ratio from. */
  h?: number
  /** Degrees. */
  r?: number
  /** Where the board turns it, when that is not its middle. */
  origin?: string
  /** Painted under the sun rather than over the athlete. */
  back?: boolean
}

type Character = {
  id: string
  photo: string
  alt: string
  player: string
  /** The board's sticker. Its colour and tilt are in the stylesheet. */
  word: string
  trinkets?: Trinket[]
}

const CHARACTERS: Character[] = [
  {
    id: 'apex-kick',
    photo: apexPhoto,
    alt: 'The Apex-Kick tee worn on a football pitch, ball under one arm',
    player: apexPlayer,
    word: 'Goal',
    trinkets: [
      { id: 'disc', svg: namespaceIds(apexDisc, 'disc-'), x: 22.53, y: 82.96, w: 16.69 },
    ],
  },
  {
    id: 'sky-smash',
    photo: smashPhoto,
    alt: 'The Sky-Smash tee worn on a badminton court, racket raised',
    player: smashPlayer,
    word: 'Smash',
    trinkets: [
      { id: 'tag-green', src: smashTagGreen, x: 2.87, y: 38.32, w: 12.09, back: true },
      { id: 'tag-pink', src: smashTagPink, x: 7.48, y: 21.67, w: 10.04, back: true },
      { id: 'shuttle', src: smashShuttle, x: 35.0, y: 29.55, w: 4.44, r: -135 },
      { id: 'bolt', src: smashBolt, x: 6.4, y: 64.84, w: 13.3, r: -15.3, origin: '50% 44.86%' },
    ],
  },
  {
    id: 'crick-stryke',
    photo: crickPhoto,
    alt: 'The Crick-Stryke tee worn on a cricket ground, bat over one shoulder',
    player: crickPlayer,
    word: 'Six',
    trinkets: [
      { id: 'ball', src: crickBall, x: 53.04, y: 8.89, w: 3.39, r: -80.71, origin: '43.87% 43.92%' },
      { id: 'spark', src: crickSpark, x: 52.17, y: 7.4, w: 3.33, r: -80.71 },
      { id: 'helmet', src: crickHelmet, x: 0.15, y: 26.7, w: 14.06, r: -50.13 },
      { id: 'bolt', svg: namespaceIds(crickBolt, 'bolt-'), x: -1.84, y: 48.81, w: 19.89, r: 9.08, origin: '50% 46.93%' },
      { id: 'crescent', src: crickCrescent, x: 13.14, y: 2.53, w: 13.1, r: -15.08, origin: '39.81% 0%' },
    ],
  },
  {
    id: 'spin-ignite',
    photo: spinPhoto,
    alt: 'The Spin-Ignite tee worn on a clay court, mid-rally',
    player: spinPlayer,
    word: 'Ace',
    trinkets: [
      // No artwork for this one: the board draws it as a plain black rectangle.
      { id: 'bar', x: 14.69, y: 41.52, w: 4.0, h: 46.27, r: -47.53, back: true },
      { id: 'ball', src: spinBall, x: 44.23, y: 26.41, w: 3.39, r: -80.71, origin: '43.94% 43.95%' },
      { id: 'spark', src: spinSpark, x: 43.35, y: 24.93, w: 3.33, r: -80.71 },
      { id: 'orb', src: spinOrb, x: 3.18, y: 60.21, w: 8.4 },
      { id: 'orb-a', src: spinOrbA, x: 4.13, y: 61.79, w: 2.78 },
      { id: 'orb-b', src: spinOrbB, x: 8.18, y: 61.35, w: 1.86 },
      { id: 'orb-c', src: spinOrbC, x: 4.48, y: 60.26, w: 4.46 },
      { id: 'racket', src: spinRacket, x: -1.39, y: 17.77, w: 16.55, r: -55.39 },
    ],
  },
]

/** Seconds a character holds before the collage turns over.
 *
 * 2.6, not 4.5. Four characters at four and a half seconds is nineteen seconds
 * to see the collection through, and most readers are past the section before
 * the third one arrives — which is the whole point of the swap. Retimed with
 * `.ground__slide`'s transition and `FADE` in groundMotion.ts; the three are
 * one beat and move together. */
const HOLD = 2.6

// Namespaced once at module load: the boards came out of one export session and
// share generated def names, so two of them inlined into the same document
// would have the second resolve the first's masks.
const PITCH_SVG = namespaceIds(pitch, 'pitch-')
const SUN_SVG = namespaceIds(sun, 'sun-')

/**
 * The idle bob, spread so no two pieces breathe together: five periods, four
 * phases and three amplitudes, none of which line up. Enough that a collage of
 * eight never reads as one mass, and cheaper than a hand-picked triple each.
 *
 * The swing rides on the same period, alternating sign so neighbours lean apart
 * rather than together. Under a degree, because these are pieces PINNED to a
 * board: enough to take the stillness off, not enough to read as anything
 * turning.
 */
const bob = (i: number) =>
  ({
    '--ground-float': `${3.4 + (i % 5) * 0.7}s`,
    '--ground-phase': `${-0.4 - (i % 4) * 0.8}s`,
    '--ground-lift': `${-0.6 - (i % 3) * 0.2}cqw`,
    '--ground-swing': `${(i % 2 ? -1 : 1) * (0.55 + (i % 3) * 0.2)}deg`,
  }) as React.CSSProperties

const place = (t: Trinket, i: number) =>
  ({
    '--x': `${t.x}%`,
    '--y': `${t.y}%`,
    '--w': `${t.w}%`,
    ...(t.h ? { '--h': `${t.h}%` } : null),
    ...(t.r ? { '--r': `${t.r}deg` } : null),
    ...(t.origin ? { '--origin': t.origin } : null),
    ...bob(i),
  }) as React.CSSProperties

/**
 * Puts inlined artwork in the DOM and leaves it there.
 *
 * Deliberately NOT `dangerouslySetInnerHTML`. React owns whatever it renders,
 * and this section re-renders every time the collage turns over — which had
 * React rebuild these subtrees from its own copy of the markup and silently
 * throw away everything GSAP had put in them: the transforms on the pitch's
 * rungs, the spare rung, the disc's spare mark. The animations were being
 * created correctly and then wiped a few seconds later.
 *
 * An effect writes it once and React never sees inside.
 */
function useInlineSvg(host: React.RefObject<HTMLDivElement | null>, html: string) {
  useEffect(() => {
    const el = host.current
    if (!el || el.firstChild) return
    el.innerHTML = html
  }, [host, html])
}

/**
 * The player art has to be in the DOM — parts of it move, and that needs the
 * paths, not an <img>. Fetched rather than bundled: at 124 to 296 kB these are
 * the four heaviest files on the site, and as `?raw` imports they would ride in
 * the JS bundle and be re-downloaded on every code change, where as assets they
 * stay cached.
 */
function usePlayer(host: React.RefObject<HTMLDivElement | null>, src: string, id: string) {
  useEffect(() => {
    const el = host.current
    if (!el) return
    let cancelled = false

    // Deferred until the section is near: every character in the collection
    // mounts at once, so the one on its way in has something to cross-fade
    // from, and together they are the better part of a megabyte.
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return
        io.disconnect()
        fetch(src)
          .then((r) => r.text())
          .then((text) => {
            if (cancelled) return
            el.innerHTML = namespaceIds(text, `${id}-`)
            const svg = el.querySelector('svg')
            if (!svg) return
            svg.removeAttribute('width')
            svg.removeAttribute('height')
            el.dispatchEvent(new Event('svgready', { bubbles: true }))
          })
          .catch(() => {})
      },
      { rootMargin: '400px' },
    )
    io.observe(el)

    return () => {
      cancelled = true
      io.disconnect()
    }
  }, [host, src, id])
}

/**
 * A trinket whose artwork is in the DOM rather than behind an <img>.
 *
 * Its own component so each one owns its host — there is more than one of these
 * across the four boards now, and a single ref on the collage could only ever
 * reach the first. The effect that fills it is the same `useInlineSvg` the
 * pitch and sun use, and for the same reason: React must never own this markup.
 */
function InlineTrinket({ t, i }: { t: Trinket; i: number }) {
  const host = useRef<HTMLDivElement>(null)
  useInlineSvg(host, t.svg ?? '')

  return (
    <div
      className="ground__trinket"
      data-trinket={t.id}
      style={place(t, i)}
      aria-hidden="true"
      ref={host}
    />
  )
}

/**
 * One character's collage.
 *
 * Order is the boards' own paint order: the odds and ends marked `back` go
 * under the sun — which is where the tennis board's black bar has to be, laid
 * over the pitch grid and beneath everything else — and the rest sit over the
 * athlete.
 */
function Collage({ character }: { character: Character }) {
  const art = useRef<HTMLDivElement>(null)
  const playerHost = useRef<HTMLDivElement>(null)
  const pitchHost = useRef<HTMLDivElement>(null)
  const sunHost = useRef<HTMLDivElement>(null)

  useInlineSvg(pitchHost, PITCH_SVG)
  useInlineSvg(sunHost, SUN_SVG)
  usePlayer(playerHost, character.player, character.id)

  // After the four hooks above, so the artwork is in the DOM to be wired.
  useEffect(() => (art.current ? animateGround(art.current) : undefined), [])

  const trinkets = character.trinkets ?? []
  const draw = (t: Trinket, i: number) =>
    t.svg ? (
      <InlineTrinket key={t.id} t={t} i={i} />
    ) : t.src ? (
      <img
        key={t.id}
        className="ground__trinket"
        data-trinket={t.id}
        style={place(t, i)}
        src={t.src}
        alt=""
        aria-hidden="true"
      />
    ) : (
      <div
        key={t.id}
        className="ground__trinket"
        data-trinket={t.id}
        style={place(t, i)}
        aria-hidden="true"
      />
    )

  return (
    <div className="ground__art" data-character={character.id} ref={art}>
      <div className="ground__pitch" aria-hidden="true" ref={pitchHost} />
      {trinkets.map((t, i) => (t.back ? draw(t, i) : null))}
      <div className="ground__sun" aria-hidden="true" ref={sunHost} />
      <img
        className="ground__shot"
        src={character.photo}
        alt={character.alt}
        loading="lazy"
        decoding="async"
      />
      <div className="ground__player" aria-hidden="true" ref={playerHost} />
      {/* Decorative lettering on the artwork, not copy — the claim already
          carries the section for assistive tech. */}
      <p className="ground__word" aria-hidden="true">
        {character.word}
      </p>
      {trinkets.map((t, i) => (t.back ? null : draw(t, i)))}
    </div>
  )
}

/**
 * Turns the collage over on a timer, and only while the section is on screen —
 * a carousel advancing behind a page nobody is looking at would be showing
 * characters to no one and would land the reader mid-crossfade on their way
 * back to it.
 */
function useTurnover(host: React.RefObject<HTMLElement | null>, count: number) {
  const [at, setAt] = useState(0)

  useEffect(() => {
    const el = host.current
    if (!el || count < 2) return
    let timer = 0

    const io = new IntersectionObserver(
      ([e]) => {
        clearInterval(timer)
        if (e.isIntersecting) {
          timer = window.setInterval(
            () => setAt((i) => (i + 1) % count),
            HOLD * 1000,
          )
        }
      },
      { threshold: 0.2 },
    )
    io.observe(el)

    return () => {
      clearInterval(timer)
      io.disconnect()
    }
  }, [host, count])

  return at
}

export function Ground() {
  const section = useRef<HTMLElement>(null)
  const at = useTurnover(section, CHARACTERS.length)

  return (
    <section className="ground" aria-labelledby="ground-title" ref={section}>
      <div className="ground__inner">
        <h2
          className="ground__title"
          id="ground-title"
          aria-label={CLAIM.join(' ')}
        >
          {CLAIM.map((line, i) => (
            // The board sets the second phrase in magenta; the rest are white.
            <span className="ground__line" key={line} data-hot={i === 1 || undefined} aria-hidden="true">
              {line}
            </span>
          ))}
        </h2>

        {/* Every collage occupies the same cell so the frame never resizes as
            the character turns over, and the one on its way out can fade
            without leaving the layout. */}
        <div className="ground__deck">
          {CHARACTERS.map((c, i) => (
            <div className="ground__slide" key={c.id} data-on={i === at || undefined}>
              <Collage character={c} />
            </div>
          ))}
        </div>

        <p className="ground__copy">{COPY}</p>
      </div>
    </section>
  )
}
