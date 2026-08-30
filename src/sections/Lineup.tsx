import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import chrome from '../assets/products/card-chrome.svg'
import crickStryke from '../assets/products/crick-stryke.webp'
import apexKick from '../assets/products/apex-kick.webp'
import skySmash from '../assets/products/sky-smash.webp'
import spinIgnite from '../assets/products/spin-ignite.webp'
import rimCrush from '../assets/products/rim-crush.webp'
import leagueTee from '../assets/products/league-tee.webp'
import helmet from '../assets/lineup/helmet.webp'
import racket from '../assets/lineup/racket.webp'
import propBall from '../assets/lineup/prop-ball.svg'
import propShuttle from '../assets/lineup/prop-shuttle.svg'

gsap.registerPlugin(ScrollTrigger)

/**
 * The line-up, in two named groups.
 *
 * The list used to be five tees with nothing saying what they were, which reads
 * as a list of made-up words on a shop page. Naming the category before the
 * products is what turns it into a catalogue — and it is also what makes room
 * for the cap, which the grid above already sells and this list had no way to
 * hold.
 *
 * `league-tee.webp` is the cap's shot despite its name: the fifth photograph in
 * the set is the cap's, not a second Spin-Ignite tee. See the note in
 * Products.tsx.
 */
const RAW_GROUPS = [
  {
    id: 'tees',
    label: 'Graphic Tshirt',
    items: [
      { id: 'crick-stryke', name: 'Crick-Stryke', photo: crickStryke, sport: 'cricket', kind: 'tee' },
      { id: 'apex-kick', name: 'Apex-Kick', photo: apexKick, sport: 'football', kind: 'tee' },
      { id: 'sky-smash', name: 'Sky-Smash', photo: skySmash, sport: 'badminton', kind: 'tee' },
      { id: 'spin-ignite', name: 'Spin-Ignite', photo: spinIgnite, sport: 'tennis', kind: 'tee' },
      { id: 'rim-crush', name: 'Rim-Crush', photo: rimCrush, sport: 'basketball', kind: 'tee' },
    ],
  },
  {
    id: 'caps',
    label: 'Caps',
    items: [
      { id: 'league-cap', name: 'Cap', photo: leagueTee, sport: 'basketball', kind: 'cap' },
    ],
  },
]

/**
 * Numbered straight through both groups, so the `[ 03 ]` the reader sees and the
 * index the stepping opens are one number and a group boundary costs the
 * stepping nothing.
 */
let seq = 0
const GROUPS = RAW_GROUPS.map((g) => ({
  ...g,
  items: g.items.map((it) => ({ ...it, at: seq++ })),
}))
const COUNT = seq

/** What the shot actually shows, which is not always a tee. */
const shotAlt = (it: { name: string; sport: string; kind: string }) =>
  it.kind === 'cap'
    ? `The league cap, worn on a ${it.sport} court`
    : `${it.name} tee, worn on a ${it.sport} court`

/**
 * The stretch of scroll the items are stepped across.
 *
 * It used to be one viewport height, measured from the section's top. On an
 800-tall window that was 160px per item — you could not read a title before it
 * closed — and, worse, the section itself only passes through the window in
 * about 640px of scroll, so the range outlasted the thing it belonged to: the
 * last two items opened and closed after the line-up had already left the
 * screen.
 *
 * Keyed to the section's own pass instead: the span works out at the section's
 * height plus a fifth of the window, so it grows with the list rather than with
 * the screen — which is what lets a sixth item and two group headings be added
 * without retuning anything.
 *
 * The section's height does not depend on which item is open, because exactly
 * one always is, so this is measured against something the panels cannot move —
 * which is what the fixed length was there to avoid in the first place.
 *
 * `bottom 65%` finishes the sequence with a third of the window still on the
 * foot of the list, rather than after the section has gone.
 */
const RANGE_START = 'top 85%'
const RANGE_END = 'bottom 65%'

const SCATTER = [
  { id: 'helmet', src: helmet, kind: 'img' },
  { id: 'ball', src: propBall, kind: 'img' },
  { id: 'racket', src: racket, kind: 'img' },
  { id: 'shuttle', src: propShuttle, kind: 'img' },
] as const

/**
 * How far each scattered prop lags or leads the page, as a share of the scroll
 * the section takes to cross the window. Signed: negative rides up against the
 * scroll, positive trails it.
 *
 * The same idea as the catalogue's balls — see `drift` in propMotion.ts — and
 * about half the share of it, because these sit BEHIND the titles rather than
 * in the gaps between cards, and a prop that travels far enough to reach a word
 * is a prop in the way. A share rather than a pixel count, so the differential
 * holds at any window height and any list length.
 *
 * Split either side of where the stylesheet places each one, so the excursion
 * is centred on the artwork's own position instead of running away from it.
 */
const DRIFT = [-0.05, 0.06, -0.065, 0.045]

export function Lineup() {
  const section = useRef<HTMLElement>(null)
  const [open, setOpen] = useState(0)

  useEffect(() => {
    const el = section.current
    if (!el) return

    /**
     * Exactly one item is open, stepped from the section's scroll progress.
     *
     * Two earlier attempts were worse. Picking whichever item's box is nearest a
     * trigger line is unstable: the open panel makes its own item ~7x taller, so
     * it stays nearest the line for ever. Measuring against the list's top fixes
     * the feedback but paces off the title height — the whole list in ~300px of
     * scroll, far too fast to read.
     *
     * Progress spreads the items evenly across the section's pass instead, which
     * is stable (it never reads a height the panels can change) and paces itself
     * to however many items the list ends up with — across both groups, because
     * the numbering above runs straight through them.
     */
    const st = ScrollTrigger.create({
      trigger: el,
      start: RANGE_START,
      end: RANGE_END,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        const i = Math.floor(self.progress * COUNT)
        setOpen(Math.max(0, Math.min(COUNT - 1, i)))
      },
      // `onUpdate` only runs inside the range, so leaving it upward used to
      // leave the last item open — scroll back down to the section and it
      // opened on the last one before stepping back to the first. Reset on the
      // way out so it is always entered from the top.
      onLeaveBack: () => setOpen(0),
    })

    /**
     * The props are not pinned to the list. Over the section's pass they gain
     * or lose a little of the page's own travel, so they slide against the
     * titles the whole way past rather than riding with them.
     *
     * GSAP writes `transform`; the section reveal writes CSS `translate` on the
     * same elements. Two different properties that compose, which is the only
     * reason both can own a piece of this movement at once — the same split the
     * episode cards use for their float and their deal.
     */
    const scatter = [...el.querySelectorAll<HTMLElement>('.lineup__scatter')]
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const pass = () => el.offsetHeight + window.innerHeight
    const drifts = still
      ? []
      : scatter.map((prop, i) => {
          const half = () => (DRIFT[i % DRIFT.length] * pass()) / 2
          return gsap.fromTo(
            prop,
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
          )
        })

    return () => {
      st.kill()
      drifts.forEach((t) => {
        t.scrollTrigger?.kill()
        t.kill()
      })
    }
  }, [])

  return (
    <section className="lineup" aria-label="The line-up" ref={section}>
      {GROUPS.map((g) => (
        <div className="lineup__group" key={g.id}>
          {/* The category, in the list's own face. Ruled either side, which is
              the treatment the episode deck already gives a label — see
              `.episodes__choose` — so a heading in the same italic 800 as the
              product names still reads as a heading and not as a sixth tee. */}
          <h3 className="lineup__group-title">{g.label}</h3>

          <ul className="lineup__list">
            {g.items.map((it) => (
              <li
                className="lineup__item"
                key={it.id}
                data-open={it.at === open || undefined}
              >
                <h4 className="lineup__title">{it.name}</h4>

                {/* Collapsed with grid-template-rows: 0fr, which animates to the
                    panel's natural height without measuring it. */}
                <div className="lineup__panel">
                  <div className="lineup__panel-inner">
                    <div className="lineup__row">
                      <span className="lineup__index">
                        [ {String(it.at + 1).padStart(2, '0')} ]
                      </span>

                      <div className="lineup__card">
                        <img
                          className="lineup__photo"
                          src={it.photo}
                          alt={shotAlt(it)}
                          loading="lazy"
                          decoding="async"
                        />
                        <img
                          className="lineup__chrome"
                          src={chrome}
                          alt=""
                          aria-hidden="true"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}

      {SCATTER.map((s) => (
        <img
          key={s.id}
          className="lineup__scatter"
          data-scatter={s.id}
          src={s.src}
          alt=""
          aria-hidden="true"
          loading="lazy"
          decoding="async"
        />
      ))}
    </section>
  )
}
