import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import spinIgnite from '../assets/episodes/spin-ignite.svg'
import skySmash from '../assets/episodes/sky-smash.svg'
import crickStryke from '../assets/episodes/crick-stryke.svg'
import apexKick from '../assets/episodes/apex-kick.svg'
import rimCrush from '../assets/episodes/rim-crush.svg'
import { animateCard } from './episodeParts'
import { namespaceIds } from '../lib/inlineSvg'

gsap.registerPlugin(ScrollTrigger)

const TITLE = 'Every match an episode'

const EPISODES = [
  { id: 'spin-ignite', src: spinIgnite, title: 'Spin-Ignite', sport: 'tennis' },
  { id: 'sky-smash', src: skySmash, title: 'Sky-Smash', sport: 'badminton' },
  { id: 'crick-stryke', src: crickStryke, title: 'Crick-Stryke', sport: 'cricket' },
  { id: 'apex-kick', src: apexKick, title: 'Apex-Kick', sport: 'football' },
  { id: 'rim-crush', src: rimCrush, title: 'Rim-Crush', sport: 'basketball' },
]

/**
 * Cards are fetched and inlined rather than left as <img> because one prop in
 * each has to be animated, and that needs the paths in the DOM. Fetching keeps
 * 1.3 MB of traced art out of the JS bundle — it stays a cached asset — and the
 * observer defers both the request and the parse until the row is near view.
 */
function Card({ ep }: { ep: (typeof EPISODES)[number] }) {
  const host = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = host.current
    if (!el) return
    let stop: (() => void) | undefined
    let cancelled = false

    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return
        io.disconnect()
        fetch(ep.src)
          .then((r) => r.text())
          .then((text) => {
            if (cancelled) return
            el.innerHTML = namespaceIds(text, `${ep.id}-`)
            const svg = el.querySelector('svg')
            if (!svg) return
            svg.removeAttribute('width')
            svg.removeAttribute('height')
            svg.setAttribute('role', 'img')
            svg.setAttribute('aria-label', `${ep.title} — ${ep.sport} episode poster`)
            stop = animateCard(svg, ep.id)
          })
          .catch(() => {})
      },
      { rootMargin: '300px' },
    )
    io.observe(el)

    return () => {
      cancelled = true
      io.disconnect()
      stop?.()
    }
  }, [ep])

  return <div className="episodes__art" ref={host} />
}

/**
 * The title lands a letter at a time as the section arrives: each character
 * drops in stretched and tilted and overshoots into place, which is the beat an
 * anime title card hits — squash and stretch, not a fade. `back.out` is what
 * does the overshoot; the vertical stretch is what stops it reading as a plain
 * slide.
 *
 * Split per character in the markup rather than by a plugin, with the whole
 * string on the heading's aria-label so assistive tech gets the sentence and not
 * 22 letters.
 */
function useTitleSlam(el: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const host = el.current
    if (!host) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const ctx = gsap.context(() => {
      gsap.from('.episodes__char', {
        yPercent: 130,
        rotate: -9,
        scaleY: 1.7,
        opacity: 0,
        transformOrigin: '50% 100%',
        duration: 0.55,
        ease: 'back.out(2.4)',
        stagger: 0.035,
        scrollTrigger: { trigger: host, start: 'top 85%', once: true },
      })
    }, host)

    return () => ctx.revert()
  }, [el])
}

export function Episodes() {
  const title = useRef<HTMLHeadingElement>(null)
  useTitleSlam(title)

  return (
    <section className="episodes" aria-labelledby="episodes-title">
      <h2
        className="episodes__title"
        id="episodes-title"
        ref={title}
        aria-label={TITLE}
      >
        {TITLE.split(' ').map((word, w) => (
          <span key={w} aria-hidden="true">
            {w > 0 && ' '}
            <span className="episodes__word">
              {[...word].map((ch, c) => (
                <span className="episodes__char" key={c}>
                  {ch}
                </span>
              ))}
            </span>
          </span>
        ))}
      </h2>

      <ul className="episodes__row">
        {EPISODES.map((ep) => (
          <li className="episodes__card" key={ep.id}>
            <Card ep={ep} />
          </li>
        ))}
      </ul>
    </section>
  )
}
