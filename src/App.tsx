import { Hero } from './sections/Hero'
import { Episodes } from './sections/Episodes'
import { Products } from './sections/Products'
import { Lineup } from './sections/Lineup'
import { Cursor } from './Cursor'
import { useSmoothScroll } from './lib/useParallax'
import { useIdleOffscreen } from './lib/useIdleOffscreen'

export default function App() {
  useSmoothScroll()
  // Sections that are not on screen stop animating — see the hook.
  useIdleOffscreen('.hero-runway, .episodes-runway, .products, .lineup')

  return (
    <>
      <main>
        <Hero />
        <Episodes />
        <Products />
        <Lineup />
      </main>
      <Cursor />
    </>
  )
}
