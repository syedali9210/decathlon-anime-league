import { useEffect, useRef } from 'react'
import { LAYERS } from './layers'
import { animateScene } from './animate'

/**
 * The illustration. `.stage__art` is sized to cover the viewport in pure CSS
 * (see index.css) while keeping the artboard's 1495:903 ratio, so every layer
 * inside it can be a plain `inset:0` overlay.
 */
export function Stage() {
  const stage = useRef<HTMLDivElement>(null)

  // Runs after the layer markup is in the DOM — the moving parts are paths
  // inside it, and the flag wave needs getBBox on each one.
  useEffect(() => (stage.current ? animateScene(stage.current) : undefined), [])

  return (
    <div
      className="stage"
      ref={stage}
      aria-hidden="true"
      // ?lines outlines every traced path — see the "vector line mode" rule in
      // index.css. The hook is one CSS selector because the layers are inline.
      data-lines={
        new URLSearchParams(window.location.search).has('lines') || undefined
      }
    >
      <div className="stage__art">
        {LAYERS.map((l) => (
          <div
            key={l.id}
            className="layer"
            data-layer={l.id}
            style={
              {
                '--depth': l.depth,
                '--exit-x': l.exit ?? 0,
                '--grow': l.grow ?? 0,
                '--inward': l.inward ?? 0,
                '--down': l.down ?? 0,
                '--shrink': l.shrink ?? 0,
                '--idle': l.idle ? `${l.idle}s` : undefined,
                transformOrigin: l.origin?.join(' '),
              } as React.CSSProperties
            }
            // Inline rather than <img> so every traced path stays a live DOM
            // node — that is what makes recolouring and line work possible.
            dangerouslySetInnerHTML={{ __html: l.svg }}
          />
        ))}
      </div>
    </div>
  )
}
