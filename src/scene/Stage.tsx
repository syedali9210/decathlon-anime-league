import { Fragment, useEffect, useRef } from 'react'
import { LAYERS } from './layers'
import { animateScene } from './animate'
import { namespaceIds } from '../lib/inlineSvg'

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
      // Not aria-hidden as a whole any more: the banners carry real links, and a
      // focusable element inside an aria-hidden subtree is reachable by keyboard
      // but invisible to a screen reader. The artwork is hidden per layer below
      // instead, which leaves the links exposed.
      // ?lines outlines every traced path — see the "vector line mode" rule in
      // index.css. The hook is one CSS selector because the layers are inline.
      data-lines={
        new URLSearchParams(window.location.search).has('lines') || undefined
      }
    >
      <div className="stage__art">
        {LAYERS.map((l) => {
          const vars = {
            '--depth': l.depth,
            '--exit-x': l.exit ?? 0,
            '--grow': l.grow ?? 0,
            '--inward': l.inward ?? 0,
            '--down': l.down ?? 0,
            '--shrink': l.shrink ?? 0,
            '--idle': l.idle ? `${l.idle}s` : undefined,
            transformOrigin: l.origin?.join(' '),
          } as React.CSSProperties

          return (
            <Fragment key={l.id}>
              <div
                className="layer"
                data-layer={l.id}
                aria-hidden="true"
                style={vars}
                // Inline rather than <img> so every traced path stays a live DOM
                // node — that is what makes recolouring and line work possible.
                // Namespaced per layer, like every other inlined export on the
                // site. These fifteen all came out of one export session and so
                // had unique ids by luck, until a layer was replaced from a
                // different one: the new banner carried `clip0_104_99489`, the
                // same generated id the badge uses, and the whole middle of the
                // scene stopped painting. Prefixing stops the next swap doing it.
                dangerouslySetInnerHTML={{
                  __html: namespaceIds(l.svg, `${l.id}-`),
                }}
              />
              {/* The board sets copy on the medallion itself. Its own layer,
                  carrying the same transform variables as the art, so the words
                  ride the parallax and the condense with the plate they are
                  printed on rather than sliding across it. */}
              {l.caption && (
                <div className="layer" data-layer={`${l.id}-caption`} style={vars}>
                  <p
                    className="layer__caption"
                    style={{
                      left: l.caption.box[0],
                      top: l.caption.box[1],
                      width: l.caption.box[2],
                    }}
                  >
                    {l.caption.lines.map((line, i) => (
                      <Fragment key={line}>
                        {i > 0 && <br />}
                        {line}
                      </Fragment>
                    ))}
                  </p>
                </div>
              )}
            </Fragment>
          )
        })}
      </div>
    </div>
  )
}
