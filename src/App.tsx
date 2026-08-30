import { Hero } from './sections/Hero'
import { Episodes } from './sections/Episodes'
import { Products } from './sections/Products'
import { Ground } from './sections/Ground'
import { Lineup } from './sections/Lineup'
import { Footer } from './sections/Footer'
import { Cursor } from './Cursor'
import { ShopButton } from './ShopButton'
import { ScrollCue } from './ScrollCue'
import { useSmoothScroll } from './lib/useParallax'
import { useIdleOffscreen } from './lib/useIdleOffscreen'
import { useReveal } from './lib/useReveal'

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
      <ScrollCue />
      <ShopButton />
      <Cursor />
    </>
  )
}
