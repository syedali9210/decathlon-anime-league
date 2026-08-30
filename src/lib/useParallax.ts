import { useEffect, type RefObject } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'

gsap.registerPlugin(ScrollTrigger)

/**
 * Drives three numbers on the hero that everything inside it reads:
 *   --mx / --my  pointer position, -1..1, damped
 *   --sy         scroll progress through the hero, 0..1
 *
 * Written on the hero rather than the stage so the ball, which lives outside
 * the stage's clip, gets the same `--exit` the layers do. One style write per
 * frame for the whole scene instead of one per layer. Honours
 * prefers-reduced-motion by simply never starting.
 */
export function useParallax(host: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = host.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const ctx = gsap.context(() => {
      const toX = gsap.quickTo(el, '--mx', { duration: 0.9, ease: 'power3' })
      const toY = gsap.quickTo(el, '--my', { duration: 0.9, ease: 'power3' })

      const onMove = (e: PointerEvent) => {
        toX((e.clientX / window.innerWidth) * 2 - 1)
        toY((e.clientY / window.innerHeight) * 2 - 1)
      }
      const onLeave = () => {
        toX(0)
        toY(0)
      }
      // Fine pointers only — on touch the scroll trigger below does the work.
      const fine = window.matchMedia('(pointer: fine)')
      if (fine.matches) {
        window.addEventListener('pointermove', onMove, { passive: true })
        document.addEventListener('pointerleave', onLeave)
      }

      ScrollTrigger.create({
        trigger: el.closest('[data-scroll-runway]') ?? el,
        start: 'top top',
        // `bottom bottom`, not `bottom top`: the runway's bottom reaching the
        // viewport's bottom is the exact moment the sticky hero unpins. Keyed
        // to the whole runway instead, --sy only reaches 0.43 by then and the
        // back half of the choreography plays to an empty screen while the
        // hero is already sliding away.
        end: 'bottom bottom',
        onUpdate: (self) => el.style.setProperty('--sy', String(self.progress)),
      })

      return () => {
        window.removeEventListener('pointermove', onMove)
        document.removeEventListener('pointerleave', onLeave)
      }
    }, el)

    return () => ctx.revert()
  }, [host])
}

/**
 * The running Lenis, so `scrollToSection` can hand it a target.
 *
 * Lenis intercepts anchor clicks for us (`anchors: true`) but nothing else: a
 * native `scrollTo` or `scrollIntoView` moves the window while Lenis still
 * believes the page is where it left it, and the next frame snaps back.
 * Anything that scrolls the page programmatically has to go through it.
 */
let lenis: Lenis | null = null

/**
 * The curve a programmatic scroll travels on: ease in, ease out, symmetric.
 *
 * Lenis's own default is an exponential-out, which is right for a short hop —
 * it puts you there and settles. Over the four thousand pixels between the deck
 * and the story it spends most of the distance in the first third of the time,
 * so the page in between goes past as a smear and the arrival reads as a cut.
 * Easing IN as well means the journey starts as a movement the eye can follow,
 * and the catalogue is legible on the way down.
 */
const TRAVEL = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2

/**
 * Glides to a section, whether or not momentum scrolling is running.
 *
 * `duration` is the length of the glide in seconds, and it is the difference
 * between a jump and a journey: the scroll cue wants the reader put in front of
 * the next section, so it takes the default; an episode card is sending them
 * several sections down the page and the travel is the point, so it asks for
 * longer and the reader watches the catalogue go by on the way.
 */
export function scrollToSection(el: HTMLElement, duration = 1.1) {
  // `lerp: 0` is load-bearing. The instance is built with `lerp: 0.11` for the
  // wheel, and Lenis takes the lerp path over the duration path whenever a lerp
  // is set — so a `duration` handed to `scrollTo` was being ignored outright and
  // every glide ran the lerp's exponential approach instead: 90% of the distance
  // in the first second however long it was asked for. Overriding it to 0 here
  // is what puts this call on `duration` and `easing`, and it is scoped to the
  // call, so the wheel keeps its own feel.
  if (lenis) lenis.scrollTo(el, { duration, easing: TRAVEL, lerp: 0 })
  // Reduced motion: Lenis never started, and neither should a glide.
  else el.scrollIntoView()
}

/** Momentum scrolling, kept in step with ScrollTrigger. */
export function useSmoothScroll() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    // `anchors`, so an in-page href is smooth-scrolled by Lenis rather than
    // jumped to natively — a native jump moves the window while Lenis still
    // believes it is somewhere else, and the page snaps back on the next frame.
    const it = (lenis = new Lenis({ lerp: 0.11, anchors: true }))
    it.on('scroll', ScrollTrigger.update)
    const tick = (time: number) => it.raf(time * 1000)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)
    return () => {
      gsap.ticker.remove(tick)
      it.destroy()
      lenis = null
    }
  }, [])
}
