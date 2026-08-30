import { useEffect, useRef } from 'react'
import chrome from '../assets/products/card-chrome.svg'
import crickStryke from '../assets/products/crick-stryke.webp'
import apexKick from '../assets/products/apex-kick.webp'
import skySmash from '../assets/products/sky-smash.webp'
import spinIgnite from '../assets/products/spin-ignite.webp'
import leagueTee from '../assets/products/league-tee.webp'
import rimCrush from '../assets/products/rim-crush.webp'
import crickStrykeSm from '../assets/products/crick-stryke-sm.webp'
import apexKickSm from '../assets/products/apex-kick-sm.webp'
import skySmashSm from '../assets/products/sky-smash-sm.webp'
import spinIgniteSm from '../assets/products/spin-ignite-sm.webp'
import leagueTeeSm from '../assets/products/league-tee-sm.webp'
import rimCrushSm from '../assets/products/rim-crush-sm.webp'
import propFootball from '../assets/products/prop-football.svg?raw'
import propCricketball from '../assets/products/prop-cricketball.svg?raw'
import propShuttle from '../assets/products/prop-shuttle.svg?raw'
import propTennisball from '../assets/products/prop-tennisball.svg?raw'
import { namespaceIds } from '../lib/inlineSvg'
import { animateProp } from './propMotion'

/**
 * The Figma cards all carry the same placeholder copy — "CRICK - STRYKE BLACK"
 * six times — while the photography clearly shows six different garments. The
 * names here follow what is in each shot; swap this array for the real
 * catalogue when there is one.
 *
 * Five tees and the cap. The fifth shot is the cap's, not a second Spin-Ignite
 * tee: both people in it are wearing the cap, the man is adjusting his into
 * the camera, and the tee behind is the one card four already sells.
 */
const TEE = 899
const CAP = 799

const PRODUCTS = [
  { id: 'crick-stryke', name: 'Crick-Stryke', photo: crickStryke, small: crickStrykeSm, width: 364, sport: 'cricket', kind: 'tee', price: TEE },
  { id: 'apex-kick', name: 'Apex-Kick', photo: apexKick, small: apexKickSm, width: 480, sport: 'football', kind: 'tee', price: TEE },
  { id: 'sky-smash', name: 'Sky-Smash', photo: skySmash, small: skySmashSm, width: 480, sport: 'badminton', kind: 'tee', price: TEE },
  { id: 'spin-ignite', name: 'Spin-Ignite', photo: spinIgnite, small: spinIgniteSm, width: 480, sport: 'tennis', kind: 'tee', price: TEE },
  { id: 'league-cap', name: 'Cap', photo: leagueTee, small: leagueTeeSm, width: 480, sport: 'basketball', kind: 'cap', price: CAP },
  { id: 'rim-crush', name: 'Rim-Crush', photo: rimCrush, small: rimCrushSm, width: 480, sport: 'basketball', kind: 'tee', price: TEE },
]

/**
 * What the photo actually measures, so the browser can pick a file rather than
 * always taking the widest. Measured, not guessed: the window is two cards wide
 * up to the 900px reflow and three above it, and the grid stops growing once the
 * stage hits its 1385 cap.
 *
 *   375px window -> 145px photo -> 38.7vw
 *  1440px window -> 361px photo -> 25.1vw
 *  1600px window and up          -> 373px, fixed
 *
 * Order matters — the first matching clause wins.
 */
const PHOTO_SIZES =
  '(max-width: 900px) 39vw, (min-width: 1600px) 373px, 25vw'

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
            // The episode deck's SHOP links land here.
            <li className="pcard" id={`tee-${p.id}`} key={p.id}>
              {/* The artwork's own box, and what carries the card's 425:723.
                  The meta is its SIBLING rather than its child, which is what
                  lets it drop out of the plate and become a caption under the
                  card on a phone — see the container query in the stylesheet. */}
              <div className="pcard__plate">
                {/* Photo sits under the chrome and is clipped to the chamfered
                    window the artwork cuts for it — see --pcard-window. */}
                <img
                  className="pcard__photo"
                  src={p.photo}
                  srcSet={`${p.small} 320w, ${p.photo} ${p.width}w`}
                  sizes={PHOTO_SIZES}
                  alt={`${p.name} ${p.kind}, worn on a ${p.sport} court`}
                  loading="lazy"
                  decoding="async"
                />
                <img className="pcard__chrome" src={chrome} alt="" aria-hidden="true" />
              </div>

              <div className="pcard__meta">
                <div className="pcard__id">
                  {/* The full catalogue name: the collection, then the tee.
                      Two lines on a full-size card, which is what `pcard__id`
                      being a column and `pcard__name` wrapping are already for. */}
                  {/* The collection is its own span so a phone card can drop
                      it — see the container query in the stylesheet. It is the
                      same four words under all six cards, in a section that has
                      already said them, and losing it is what lets the name and
                      the price share one line inside the plate instead of being
                      pushed out from under the card.
                      The non-breaking space keeps the dash with the collection
                      wherever the full name does wrap. */}
                  <span className="pcard__name">
                    <span className="pcard__collection">
                      {'Anime Sports League - '}
                    </span>
                    {p.name} Black
                  </span>
                  <span className="pcard__price">₹ {p.price}</span>
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
