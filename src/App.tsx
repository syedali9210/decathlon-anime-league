import { Hero } from './sections/Hero'
import { Episodes } from './sections/Episodes'
import { Products } from './sections/Products'
import { Ground } from './sections/Ground'
import { Lineup } from './sections/Lineup'
import { Footer } from './sections/Footer'
import { Cursor } from './Cursor'
import { ShopButton } from './ShopButton'
import { ScrollCue } from './ScrollCue'
import { BrandMark } from './BrandMark'
import { useSmoothScroll } from './lib/useParallax'
import { useIdleOffscreen } from './lib/useIdleOffscreen'
import { useReveal } from './lib/useReveal'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'

export default function App() {
  useSmoothScroll()
  // Sections that are not on screen stop animating — see the hook.
  useIdleOffscreen('.hero-runway, .episodes-runway, .products, .ground, .lineup')
  // The field changes, then what stands on it arrives — see the hook. The hero
  // is not in this list: it IS the first paint, and has its own choreography.
  useReveal('.products, .ground, .lineup, .footer')

  return (
    <>
      <main>
        <Hero />
        <Episodes />
        <Products />
        <Ground />
        <Lineup />
      </main>
      {/* Outside <main>: it is the page's footer, not a section of the article. */}
      <Footer />
      <BrandMark />
      <ScrollCue />
      <ShopButton />
      <Cursor />
      {/* Neither renders anything. Page views, and then the Web Vitals behind
          them — which on a page whose whole point is motion is the half worth
          watching: LCP on the hero's traced artwork, and CLS and INP through
          the pinned sections. */}
      <Analytics />
      <SpeedInsights />
    </>
  )
}
