import corner from '../assets/frame/corner.svg'

const CORNERS = ['tl', 'tr', 'br', 'bl'] as const

/**
 * Centreline of the gold elbow, in the corner tile's own 116x180 units.
 *
 * The export gives the elbow as two edges — the inner and outer contours of the
 * `Union` path — and nothing down the middle, so this is those two averaged
 * control point by control point (both are four cubics describing the same
 * turn, so they pair off exactly). The two edges finish at different stations,
 * which leaves the average about seven units short of the straight rail; the
 * trailing `L` carries it down to y=181, where the side run's checker starts.
 *
 * Regenerate from `_figma/frame29/frame29.svg` if the board's frame changes.
 */
/**
 * Mid-radius of the medallion rim. The pink centre is r=39.75 and the gold disc
 * r=56.5, so the band sits between them; the tile size in index.css is this
 * circle's circumference over 70, which is what makes the dash meet itself
 * cleanly instead of showing a seam where the pattern wraps.
 */
const RIM = 47.8

const ELBOW =
  'M47.58 111.52C49.18 117.9 49.63 124.52 48.9 130.99C47.94 139.38 45.08 ' +
  '147.26 40.56 153.96C36.04 160.66 29.99 165.96 22.96 169.4C19.59 171.05 ' +
  '15.89 171.88 12.15 171.83L12 181'

/**
 * The border, from Figma node 195-156186.
 *
 * Four corner tiles — gold medallion, checker ring and the hooked elbow that
 * necks down into the side rail — with the straight runs between them rebuilt
 * as CSS gradients (5 gold / 14 checker / 5 gold on a 24 rail). Rebuilt rather
 * than sliced so the border sits on the viewport edge at any aspect ratio
 * instead of being cropped with the illustration.
 *
 * The belt runs the whole way round, which a gradient cannot do on anything but
 * a straight: the elbows and the medallion rims are a dashed magenta stroke laid
 * over a solid blue one — the gaps in the dash are the blue tiles — so each is
 * one animated property. The rim used to be 24 static wedges baked into
 * `corner.svg`; a stroked circle replaces them, which is what lets it move.
 */
export function Frame() {
  return (
    <div className="frame" aria-hidden="true">
      <div className="frame__edge frame__edge--top" />
      <div className="frame__edge frame__edge--bottom" />
      <div className="frame__edge frame__edge--left" />
      <div className="frame__edge frame__edge--right" />
      {CORNERS.map((c) => (
        <img key={c} className="frame__corner" data-corner={c} src={corner} alt="" />
      ))}
      {CORNERS.map((c) => (
        <svg key={c} className="frame__curve" data-corner={c} viewBox="0 0 116 180">
          <path className="frame__curve-bed" d={ELBOW} />
          <circle className="frame__ring-bed" cx="57" cy="57" r={RIM} />
          <path className="frame__curve-dash" d={ELBOW} />
          <circle className="frame__ring-dash" cx="57" cy="57" r={RIM} />
        </svg>
      ))}
    </div>
  )
}
