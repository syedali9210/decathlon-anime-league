import { useEffect, useRef } from 'react'
import chrome from '../assets/products/card-chrome.svg'
import crickStryke from '../assets/products/crick-stryke.webp'
import apexKick from '../assets/products/apex-kick.webp'
import skySmash from '../assets/products/sky-smash.webp'
import spinIgnite from '../assets/products/spin-ignite.webp'
import leagueTee from '../assets/products/league-tee.webp'
import rimCrush from '../assets/products/rim-crush.webp'
import propFootball from '../assets/products/prop-football.svg?raw'
import propCricketball from '../assets/products/prop-cricketball.svg?raw'
import propShuttle from '../assets/products/prop-shuttle.svg?raw'
import propTennisball from '../assets/products/prop-tennisball.svg?raw'
import { namespaceIds } from '../lib/inlineSvg'
import { animateProp } from './propMotion'

/**
 * The Figma cards all carry the same placeholder copy — "CRICK - STRYKE BLACK"
 * six times — while the photography clearly shows six different tees. The names
 * here follow the garment in each shot; swap this array for the real catalogue
 * when there is one.
 */
const PRODUCTS = [
  { id: 'crick-stryke', name: 'Crick-Stryke', photo: crickStryke, sport: 'cricket' },
  { id: 'apex-kick', name: 'Apex-Kick', photo: apexKick, sport: 'football' },
  { id: 'sky-smash', name: 'Sky-Smash', photo: skySmash, sport: 'badminton' },
  { id: 'spin-ignite', name: 'Spin-Ignite', photo: spinIgnite, sport: 'tennis' },
  { id: 'league-tee', name: 'Spin-Ignite', photo: leagueTee, sport: 'tennis' },
  { id: 'rim-crush', name: 'Rim-Crush', photo: rimCrush, sport: 'basketball' },
]

const COLOURWAYS = ['#e4e4e4', '#0087c0']

/**
 * The flaming props that float over the cards. Inlined rather than <img> so the
 * ball can be spun and the flame vectors flickered independently — together
 * they are only ~27 kB, so there is nothing to defer.
 */
const FLOATERS = [
  { id: 'football', svg: propFootball },
  { id: 'cricketball', svg: propCricketball },
  { id: 'shuttle', svg: propShuttle },
  { id: 'tennisball', svg: propTennisball },
]

function Prop({ id, svg, scroller }: { id: string; svg: string; scroller: React.RefObject<HTMLElement | null> }) {
  const host = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = host.current
    const sc = scroller.current
    if (!el || !sc) return
    const node = el.querySelector('svg')
    if (!node) return
    node.removeAttribute('width')
    node.removeAttribute('height')
    return animateProp(node as SVGSVGElement, id, sc)
  }, [id, scroller])

  return (
    <div
      className="products__prop"
      data-prop={id}
      ref={host}
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: namespaceIds(svg, `${id}-`) }}
    />
  )
}

export function Products() {
  const section = useRef<HTMLElement>(null)

  return (
    <section className="products" aria-label="Anime Sports League tees" ref={section}>
      <div className="products__stage">
        <ul className="products__grid">
          {PRODUCTS.map((p) => (
            <li className="pcard" key={p.id}>
              {/* Photo sits under the chrome and is clipped to the chamfered
                  window the artwork cuts for it — see --pcard-window. */}
              <img
                className="pcard__photo"
                src={p.photo}
                alt={`${p.name} tee, worn on a ${p.sport} court`}
                loading="lazy"
                decoding="async"
              />
              <img className="pcard__chrome" src={chrome} alt="" aria-hidden="true" />

              <div className="pcard__meta">
                <div className="pcard__id">
                  <span className="pcard__name">{p.name} &nbsp; Black</span>
                  <span className="pcard__price">₹ 1599</span>
                </div>
                <ul className="pcard__swatches" aria-label="Colours">
                  {COLOURWAYS.map((c) => (
                    <li key={c} style={{ background: c }} />
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ul>

        {FLOATERS.map((f) => (
          <Prop key={f.id} id={f.id} svg={f.svg} scroller={section} />
        ))}
      </div>
    </section>
  )
}
