// Parallax layer manifest.
//
// Every SVG here is a slice of the same 1596x1024 Figma artboard and keeps that
// viewBox, so the layers stack pixel-perfect with `position:absolute; inset:0`
// and need no per-layer positioning.
//
//   depth   how much the layer reacts to pointer/scroll. 0 = painted on the sky,
//           1 = pressed against the glass. Must not decrease as z-order rises,
//           or near layers slide behind far ones.
//   idle    seconds for the ambient float loop; omit to leave the layer still.
//
// The rest is the narrow-viewport recomposition. A 1.56:1 artboard cannot be
// cropped to a phone without throwing away the two players, so instead of
// cropping we pull the outer layers toward the centre and shrink the wide ones
// as `--condense` goes 0 -> 1. That is the whole reason the art is split up.
//
//   inward  percent of stage width to slide at full condense (+ = rightward)
//   down    percent of stage height to slide at full condense (+ = downward)
//   shrink  fraction to scale away at full condense
//   origin  the layer's own visual centre, as [x%, y%] of the artboard, so the
//           shrink pulls toward the artwork rather than the frame centre.
//           Percentages are of the 1495x903 content box, not the raw artboard.
//
// Last, the scroll-out. The frame stays put while the scene leaves it: the
// flanking layers part sideways from the first pixel of scroll, and the flags
// swell into the gap on a later, overlapping beat. `--exit` and `--swell` in
// index.css are the two 0 -> 1s that drive them.
//
//   exit    percent of stage width to slide as the hero scrolls away
//           (+ = rightward). Sized per layer, from its own distance to the
//           frame edge in the worst case — a wide viewport, where the frame
//           shows ~95% of the art and there is least of it hidden to slide
//           into — plus ~10%. Overshooting is free but wastes the back of the
//           range: the layer is gone early and the last third does nothing.
//   grow    extra scale at full exit, about `origin`. 1.2 = ends up 2.2x.
//
// Regenerate the SVGs with `npm run assets` (see _figma/build_assets.py).
import net from '../assets/scene/net.svg?raw'
import nebulaLeft from '../assets/scene/nebula-left.svg?raw'
import nebulaRight from '../assets/scene/nebula-right.svg?raw'
import court from '../assets/scene/court.svg?raw'
import cloudLeft from '../assets/scene/cloud-left.svg?raw'
import cloudRight from '../assets/scene/cloud-right.svg?raw'
import badge from '../assets/scene/badge.svg?raw'
import foliageRight from '../assets/scene/foliage-right.svg?raw'
import foliageLeft from '../assets/scene/foliage-left.svg?raw'
import stars from '../assets/scene/stars.svg?raw'
import playerBasketball from '../assets/scene/player-basketball.svg?raw'
import playerCricket from '../assets/scene/player-cricket.svg?raw'
import bannerRight from '../assets/scene/banner-right.svg?raw'
import bannerLeft from '../assets/scene/banner-left.svg?raw'
import flags from '../assets/scene/flags.svg?raw'

export type Layer = {
  id: string
  svg: string
  depth: number
  idle?: number
  exit?: number
  grow?: number
  inward?: number
  down?: number
  shrink?: number
  origin?: [string, string]
}

export const LAYERS: Layer[] = [
  { id: 'net', svg: net, depth: 0.1 },
  { id: 'nebula-left', svg: nebulaLeft, depth: 0.08, idle: 19, exit: -40 },
  { id: 'nebula-right', svg: nebulaRight, depth: 0.08, idle: 23, exit: 40 },
  { id: 'court', svg: court, depth: 0.16 },
  { id: 'cloud-left', svg: cloudLeft, depth: 0.2, idle: 15, exit: -50 },
  { id: 'cloud-right', svg: cloudRight, depth: 0.2, idle: 17, exit: 50 },
  {
    id: 'badge',
    svg: badge,
    depth: 0.26,
    down: -1,
    shrink: 0.36,
    origin: ['49.9%', '41.7%'],
  },
  { id: 'foliage-right', svg: foliageRight, depth: 0.72, idle: 11, exit: 48 },
  { id: 'foliage-left', svg: foliageLeft, depth: 0.72, idle: 13, exit: -48 },
  { id: 'stars', svg: stars, depth: 0.3 },
  {
    id: 'player-basketball',
    svg: playerBasketball,
    depth: 0.55,
    exit: -35,
    // A touch further in than the batsman: the ball sits off his left hip and
    // would otherwise clip the frame at full condense.
    inward: 25,
    down: 5,
    shrink: 0.12,
    origin: ['21.8%', '56.1%'],
  },
  {
    id: 'player-cricket',
    svg: playerCricket,
    depth: 0.55,
    exit: 35,
    inward: -22,
    down: 5,
    shrink: 0.12,
    origin: ['79.4%', '60.7%'],
  },
  // The banners flank the badge, so they condense with it — same shrink, same
  // origin — instead of sliding inward over the wordmark.
  {
    id: 'banner-right',
    svg: bannerRight,
    depth: 0.62,
    idle: 9,
    down: -1,
    shrink: 0.36,
    origin: ['49.9%', '41.7%'],
  },
  {
    id: 'banner-left',
    svg: bannerLeft,
    depth: 0.62,
    idle: 10,
    down: -1,
    shrink: 0.36,
    origin: ['49.9%', '41.7%'],
  },
  {
    id: 'flags',
    svg: flags,
    depth: 0.88,
    idle: 8,
    // The one layer that comes forward instead of leaving: it swells about its
    // own base until the tops of the flags clear the middle of the frame.
    grow: 1.2,
    down: 3,
    shrink: 0.34,
    origin: ['49.9%', '80.4%'],
  },
]

/** Content box every layer is cut to (see CONTENT in build_assets.py). */
export const ART = { w: 1495, h: 903 } as const
