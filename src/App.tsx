import { Hero } from './sections/Hero'
import { Episodes } from './sections/Episodes'
import { Products } from './sections/Products'
import { Lineup } from './sections/Lineup'
import { useSmoothScroll } from './lib/useParallax'

export default function App() {
  useSmoothScroll()

  return (
    <main>
      <Hero />
      <Episodes />
      <Products />
      <Lineup />
    </main>
  )
}
