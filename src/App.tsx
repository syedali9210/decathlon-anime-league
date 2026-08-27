import { Hero } from './sections/Hero'
import { Episodes } from './sections/Episodes'
import { Products } from './sections/Products'
import { Ground } from './sections/Ground'
import { Lineup } from './sections/Lineup'
import { Cursor } from './Cursor'
import { useSmoothScroll } from './lib/useParallax'
import { useIdleOffscreen } from './lib/useIdleOffscreen'

export default function App() {
  useSmoothScroll()
  // Sections that are not on screen stop animating — see the hook.
  useIdleOffscreen('.hero-runway, .episodes-runway, .products, .ground, .lineup')

  return (
    <>
      <main>
        <Hero />
        <Episodes />
        <Products />
        <Ground />
        <Lineup />
      </main>
      <Cursor />
    </>
  )
}
