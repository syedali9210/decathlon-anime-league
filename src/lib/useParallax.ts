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

/** Momentum scrolling, kept in step with ScrollTrigger. */
export function useSmoothScroll() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const lenis = new Lenis({ lerp: 0.11 })
    lenis.on('scroll', ScrollTrigger.update)
    const tick = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)
    return () => {
      gsap.ticker.remove(tick)
      lenis.destroy()
    }
  }, [])
}
