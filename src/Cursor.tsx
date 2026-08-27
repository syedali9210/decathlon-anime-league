import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import ballFootball from './assets/ui/ball-football.svg'
import ballCricket from './assets/ui/ball-cricketball.svg'
import ballShuttle from './assets/ui/ball-shuttle.svg'
import ballTennis from './assets/ui/ball-tennisball.svg'

/**
 * The mark is the ninth path of the Decathlon lockup in
 * `assets/products/card-chrome.svg` — lifted from the artwork rather than
 * redrawn. Its viewBox is that path's own bounding box, which is why the
 * coordinates look arbitrary: nothing is translated, the window is just moved
 * onto it.
 */
const MARK =
  'M360.35 22.36c-3.5 0-7.83 3.64-7.83 6.66 0 1.56 1.19 2.34 2.75 2.34 1.15 0 ' +
  '2.55-.42 3.89-1.24V24.1c-.36.62-2.04 3.11-3.4 4.44-.68.68-1.23.97-1.7.97-.53 ' +
  '0-.78-.36-.78-.9 0-2.43 4.07-5.6 6.77-5.6 1.1 0 1.82.49 1.82 1.45 0 .89-.6 ' +
  '2-1.6 3.03v1.86c1.76-1.41 2.83-3.22 2.83-4.67 0-1.46-1.18-2.32-2.75-2.32'
const MARK_BOX = '352.52 22.36 10.58 9'

/**
 * What comes out on a click: the four balls the product grid floats, cut down to
 * the ball itself. The index lists that separate ball from flame already existed
 * in `sections/propMotion.ts` — these are those sets, extracted to their own
 * bounding boxes.
 */
const BALLS = [ballFootball, ballCricket, ballShuttle, ballTennis]

/** What counts as worth glowing at. Anything can opt in with `data-cursor`. */
/**
 * What the mark morphs for. Only things that actually navigate or act: the token
 * turns into a SHOP button, so offering it over something inert is a promise the
 * page does not keep.
 *
 * `a[href]` rather than `a`, because an anchor without one is not a link. The
 * `data-cursor` hook stays as an opt-in for anything that becomes interactive
 * without being one of these elements.
 *
 * Note the attribute that hides the native cursor is `data-custom-cursor` on
 * <html>, deliberately not `data-cursor`: `closest()` walks to the root, so a
 * shared name would have matched every element on the page and the mark would
 * have offered SHOP over the whole site.
 */
const HOT =
  'a[href], button:not([disabled]), [role="button"], summary, [data-cursor]'

const BURST = 7

/**
 * The site's pointer: the Decathlon mark, damped onto the cursor position, which
 * morphs into a SHOP button over anything clickable, and scatters balls when
 * pressed.
 *
 * The morph is the whole clickable indicator: the artwork itself is left alone,
 * so nothing is added to an already busy scene. The word is `aria-hidden`,
 * because the links it describes carry their own accessible names.
 *
 * Fine pointers only, and never under reduced motion — the native cursor is only
 * hidden once this one is actually running, so there is no state where a visitor
 * has neither.
 *
 * The burst is seven fixed <img> slots reused on every press rather than
 * elements spawned per click: a press is then a src swap and a timeline restart
 * instead of DOM churn on a path a visitor hits constantly. They start out
 * holding one of each ball so all four are decoded and cached before the first
 * click rather than flashing in on it.
 */
export function Cursor() {
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = root.current
    if (!el) return
    if (!window.matchMedia('(pointer: fine)').matches) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    document.documentElement.dataset.customCursor = ''
    const balls = el.querySelectorAll<HTMLImageElement>('.cursor__ball')
    // @types/node is in the project, so setTimeout is not the DOM's number here.
    let press: ReturnType<typeof setTimeout> | undefined

    const ctx = gsap.context(() => {
      const toX = gsap.quickTo(el, 'x', { duration: 0.16, ease: 'power3' })
      const toY = gsap.quickTo(el, 'y', { duration: 0.16, ease: 'power3' })

      // What the pointer was last over. `closest` walks to the root against a
      // six-part selector list, and this runs on every pointermove — which on a
      // high-polling mouse is hundreds of tree walks a second, on the same
      // thread as the scroll. The answer can only change when the target does,
      // and moving WITHIN one element is the overwhelming case.
      let over: EventTarget | null = null

      const move = (e: PointerEvent) => {
        toX(e.clientX)
        toY(e.clientY)
        el.toggleAttribute('data-on', true)
        if (e.target === over) return
        over = e.target
        el.toggleAttribute(
          'data-hot',
          e.target instanceof Element && !!e.target.closest(HOT),
        )
      }

      const down = () => {
        // The mark's squash is a class, not a tween: CSS owns its transform.
        el.toggleAttribute('data-press', true)
        clearTimeout(press)
        press = setTimeout(() => el.toggleAttribute('data-press', false), 110)

        gsap.killTweensOf(balls)
        gsap.set(balls, { x: 0, y: 0, scale: 0, rotate: 0, opacity: 1 })
        balls.forEach((b) => {
          // which ball and where it goes are both redrawn every press, so no two
          // clicks land the same way
          b.src = gsap.utils.random(BALLS)
          const a = gsap.utils.random(0, Math.PI * 2)
          const r = gsap.utils.random(30, 72)
          gsap
            .timeline()
            .to(b, {
              // up and out first, then let it fall: thrown, not exploded
              x: Math.cos(a) * r,
              y: Math.sin(a) * r - 16,
              rotate: gsap.utils.random(-160, 160),
              scale: gsap.utils.random(0.5, 1.05),
              duration: 0.42,
              ease: 'power2.out',
            })
            .to(b, { y: '+=34', opacity: 0, duration: 0.4, ease: 'power2.in' }, 0.3)
        })
      }

      // Dropped with the pointer, so the next entry re-tests rather than
      // trusting a node that may since have left the document.
      const leave = () => {
        over = null
        el.toggleAttribute('data-on', false)
      }

      window.addEventListener('pointermove', move, { passive: true })
      window.addEventListener('pointerdown', down, { passive: true })
      document.addEventListener('pointerleave', leave)

      return () => {
        clearTimeout(press)
        window.removeEventListener('pointermove', move)
        window.removeEventListener('pointerdown', down)
        document.removeEventListener('pointerleave', leave)
      }
    }, el)

    return () => {
      ctx.revert()
      delete document.documentElement.dataset.customCursor
    }
  }, [])

  return (
    <div className="cursor" ref={root} aria-hidden="true">
      {/* One token that changes state: the mark and the word share a cell, so
          the shape opens and they trade places. */}
      <span className="cursor__morph">
        <svg className="cursor__mark" viewBox={MARK_BOX}>
          <path d={MARK} fill="currentColor" />
        </svg>
        <span className="cursor__label" aria-hidden="true">
          Shop
        </span>
      </span>
      {Array.from({ length: BURST }, (_, i) => (
        <img className="cursor__ball" key={i} src={BALLS[i % BALLS.length]} alt="" />
      ))}
    </div>
  )
}
