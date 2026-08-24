import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import chrome from '../assets/products/card-chrome.svg'
import crickStryke from '../assets/products/crick-stryke.webp'
import apexKick from '../assets/products/apex-kick.webp'
import skySmash from '../assets/products/sky-smash.webp'
import spinIgnite from '../assets/products/spin-ignite.webp'
import rimCrush from '../assets/products/rim-crush.webp'
import helmet from '../assets/lineup/helmet.webp'
import racket from '../assets/lineup/racket.webp'
import propBall from '../assets/lineup/prop-ball.svg'
import propShuttle from '../assets/lineup/prop-shuttle.svg'

gsap.registerPlugin(ScrollTrigger)

const ITEMS = [
  { id: 'crick-stryke', name: 'Crick-Stryke', photo: crickStryke, sport: 'cricket' },
  { id: 'apex-kick', name: 'Apex-Kick', photo: apexKick, sport: 'football' },
  { id: 'sky-smash', name: 'Sky-Smash', photo: skySmash, sport: 'badminton' },
  { id: 'spin-ignite', name: 'Spin-Ignite', photo: spinIgnite, sport: 'tennis' },
  { id: 'rim-crush', name: 'Rim-Crush', photo: rimCrush, sport: 'basketball' },
]

/**
 * Where the stepping starts, and how much scrolling it takes to get from the
 * first item to the last. A fixed distance rather than "until the section
 * leaves": this is currently the last section on the page, so the section's own
 * bottom never reaches the top of the viewport and a range keyed to it would
 * stall halfway. `.lineup` carries trailing space to make this reachable.
 */
const RANGE_START = 'top 70%'
const RANGE_LENGTH = () => window.innerHeight

const SCATTER = [
  { id: 'helmet', src: helmet, kind: 'img' },
  { id: 'ball', src: propBall, kind: 'img' },
  { id: 'racket', src: racket, kind: 'img' },
  { id: 'shuttle', src: propShuttle, kind: 'img' },
] as const

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
     * the feedback but paces off the title height — five items in ~300px of
     * scroll, far too fast to read.
     *
     * Progress spreads the five evenly across the section's pass instead, which
     * is stable (it never reads a height the panels can change) and paces itself
     * to however many items the list ends up with.
     */
    const st = ScrollTrigger.create({
      trigger: el,
      start: RANGE_START,
      end: () => `+=${RANGE_LENGTH()}`,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        const i = Math.floor(self.progress * ITEMS.length)
        setOpen(Math.max(0, Math.min(ITEMS.length - 1, i)))
      },
    })
    return () => st.kill()
  }, [])

  return (
    <section className="lineup" aria-label="The line-up" ref={section}>
      <ul className="lineup__list">
        {ITEMS.map((it, i) => (
          <li
            className="lineup__item"
            key={it.id}
            data-open={i === open || undefined}
          >
            <h3 className="lineup__title">{it.name}</h3>

            {/* Collapsed with grid-template-rows: 0fr, which animates to the
                panel's natural height without measuring it. */}
            <div className="lineup__panel">
              <div className="lineup__panel-inner">
                <div className="lineup__row">
                  <span className="lineup__index">
                    [ {String(i + 1).padStart(2, '0')} ]
                  </span>

                  <div className="lineup__card">
                    <img
                      className="lineup__photo"
                      src={it.photo}
                      alt={`${it.name} tee, worn on a ${it.sport} court`}
                      loading="lazy"
                      decoding="async"
                    />
                    <img className="lineup__chrome" src={chrome} alt="" aria-hidden="true" />
                  </div>

                  <span className="lineup__price">₹1599</span>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>

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
