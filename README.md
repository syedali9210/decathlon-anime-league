# Anime Sports League — Decathlon

Four sections so far, all from the same Figma file:

| section | Figma node |
|---|---|
| `Hero` — the framed poster | [159-127418](https://www.figma.com/design/suWhIOu9YsTu3h65tJePfD/Decathlon?node-id=159-127418) |
| `Episodes` — "Every match an episode" | [159-131513](https://www.figma.com/design/suWhIOu9YsTu3h65tJePfD/Decathlon?node-id=159-131513) |
| `Products` — the six-tee grid | [159-130743](https://www.figma.com/design/suWhIOu9YsTu3h65tJePfD/Decathlon?node-id=159-130743) |
| `Lineup` — the scroll-stepped list | [159-131375](https://www.figma.com/design/suWhIOu9YsTu3h65tJePfD/Decathlon?node-id=159-131375) |

Two more boards are not sections but parts of the hero:

| | Figma node |
|---|---|
| the border | [195-156186](https://www.figma.com/design/suWhIOu9YsTu3h65tJePfD/Decathlon?node-id=195-156186) |
| the scroll-out | [198-156311](https://www.figma.com/design/suWhIOu9YsTu3h65tJePfD/Decathlon?node-id=198-156311) |
| the ball that crosses it | [199-156312](https://www.figma.com/design/suWhIOu9YsTu3h65tJePfD/Decathlon?node-id=199-156312) |

`src/App.tsx` stacks them; each lives in `src/sections/`.

```bash
npm install && npm run dev
```

## Stack

| | | why |
|---|---|---|
| Vite + React 19 + TS | build & UI | no SSR needed for a campaign screen, and scroll-driven work is painful to hydrate |
| GSAP + ScrollTrigger | scroll & damping | `quickTo` for the pointer damping, ScrollTrigger for scroll progress |
| Lenis | momentum scroll | the one thing genuinely not worth hand-rolling |
| plain CSS + `@property` | layout, frame, breakpoints | the parallax is three custom properties in a `calc()`; a utility framework buys nothing here |

No Tailwind, no `vite-plugin-svgr`, no motion library. Add them when a page needs them.

## How the screen is built

The Figma node is a single vectorised illustration — 1732 traced paths in one flat
frame, no named layers. `_figma/build_assets.py` cuts it into **15 stacked SVG
layers** by paint order (see the `SCENE` table in that file), plus one corner
ornament for the frame.

Every layer keeps the same viewBox, so they stack with `position:absolute; inset:0`
and need no per-layer positioning. Layers are inlined with `?raw`, not `<img>`, so
each traced path stays a live DOM node.

```
src/sections/Hero.tsx      the framed poster
src/sections/Episodes.tsx  the five episode cards
src/sections/Products.tsx  the six-tee product grid
src/sections/Lineup.tsx    the scroll-stepped product list
src/scene/layers.ts        the manifest: depth, idle float, narrow-viewport moves
src/scene/Stage.tsx        inlines the layers, wires the parallax
src/scene/animate.ts       flags, banners, ball + hand, bat + arm
src/scene/Frame.tsx        the border
src/scene/Ball.tsx         the ball that crosses over it
src/lib/useParallax        --mx / --my / --sy, and Lenis
```

## Episodes

Five 248x379 card frames on a 310px pitch, each lifted whole out of the export —
black plate, gold rule and drop shadow included — so they need no chrome around
them. Unlike the hero layers these are `<img>`, not inlined: nothing manipulates
their paths, and 1.3 MB of traced comic art has no business in the JS bundle.
They lazy-load and cache on their own.

### Card props

One prop per card moves: the tennis racket, the badminton racket, the cricket
bat, and the basketball (`src/sections/episodeParts.ts`). Rackets and the bat
swing about their grip; the ball spins and bobs.

That forced a change of tack. The cards were `<img>` while nothing touched their
paths — animating means the paths must be in the DOM. They are now **fetched and
inlined on intersection** rather than imported: the art stays a cached asset
instead of joining the JS bundle, and neither the request nor the parse happens
until the row is near view.

**Ids must be namespaced on the way in.** Both screens came out of the same Figma
session, so their exports share generated def names — `filter0_d_104_99489` is in
the hero *and* in every card. Inlined as-is, a card resolves the hero's filter
and renders as a black rectangle. `namespaceIds` in `Episodes.tsx` prefixes every
`id="`, `url(#` and `href="#` per card.

Props are explicit path-index lists, not selectors: this is traced comic art with
no semantic groups, and shapes get merged with anything sharing their fill. The
cricket bat is one single path; the tennis racket is 22 scattered ones. Each list
is guarded by the union bbox it must resolve to, so a re-export that shifts order
warns in dev rather than silently animating a shoe.

**The football is not animated.** In `apex-kick` the ball's panels are merged by
fill with the leg and background — only about half of them select as a unit, and
a half-moving ball looks broken. Same reason the basketball's *hands* are left
still: the ball itself is a clean 6 paths, the hands are not separable from the
arms. The fix for both is a clean export — ask the designer for those two props
on their own layer and they drop straight into the same table.

The headline is live text, not the outlined path from the export. Figma has it as
Roboto Flex ExtraBold 128px; every axis in `fontVariationSettings` is Roboto
Flex's own default, so `font-weight: 800` is the whole story and the rest can be
dropped. The background gradient is rebuilt in CSS rather than exported — note it
composites over `#282828`, not black, which is what makes the foot of it
`#503b6b`.

The artboard's 248 card / 62 gap / 54 margin sum to *exactly* 100% of 1596, so
sizing cards from `vw` tips into a scrollbar on rounding. The card basis is
derived from the row instead. Below a 190px card the posters stop being legible,
and the row becomes a scroll-snap carousel.

### Parallax

`useParallax` writes three numbers on `.hero` and every layer reads them from one
`calc()` in its transform — one style write per frame for the whole scene rather
than one per layer. On the hero, not the stage, because the ball reads `--exit`
too and lives outside the stage's clip.

| | |
|---|---|
| `--mx` `--my` | pointer, −1..1, damped by `gsap.quickTo`. Fine pointers only. |
| `--sy` | progress through the hero's **pinned** scroll, 0..1 |
| `--exit` | the parting: 0..1 from the first pixel of scroll to `--sy` 0.35, linear |
| `--swell` | the flags, `--sy` 0.16..0.41 |
| `--ball` | the ball's crossing, `--sy` 0.20..0.58 |
| `depth` in `layers.ts` | 0 = painted on the sky, 1 = pressed against the glass |

Touch devices get no hover, so `(pointer: coarse)` leans harder on the scroll drift.
`prefers-reduced-motion` skips the whole thing, including the scroll runway.

### Scrolling out

The frame stays put while the scene leaves it. Over the back half of the runway
the flanking layers part sideways — nebulas, clouds, foliage and both players,
left-hand ones to the left, right-hand ones to the right — and the checkered
flags swell about their own base until the tops clear the middle of the frame.
The badge and its two banners stay: they are the wordmark, and the court and net
are the ground the whole thing stands on.

`exit` (percent of stage width, + = rightward) and `grow` (extra scale about
`origin`) in `layers.ts`, multiplied by `--exit` and `--swell` in the same
`calc()` that already carries the pointer sweep and the condense. No new element,
no second ScrollTrigger — the scroll-out is the parallax transform with two more
terms.

**The timing is measured off [yesnowww.com](https://yesnowww.com), the same site
the frame was modelled on.** Three things there are worth having, and the first
two are the opposite of the obvious choice:

- **It starts on the first pixel of scroll**, with no dead zone before the scene
  begins to leave.
- **It is linear**, not eased-in: their parting holds a flat 232px per 200px of
  scroll for three straight samples before decelerating, and it only decelerates
  once the element is past the edge. Here the frame crops that tail anyway, so
  linear is the whole of it.
- **It is a relay, not one curve.** Their hero pair runs 0→2vh, a second pair
  shrinks and separates from 1.6vh, a third grows from 2vh — each beat overlapping
  the tail of the one before. Hence three ranges here rather than one: `--exit`,
  then `--swell`, then `--ball`.

Not copied: their late opacity fade. Their elements travel about one viewport
width and would still be on screen at the end, so the fade covers the last of it.
Ours are cropped by the border, which does the same job for nothing.

#### The pinned window

**`--sy` is measured over the stretch the hero stays pinned for, not over the
whole runway** — `end: 'bottom bottom'` on the ScrollTrigger, not `bottom top`.
The runway's bottom reaching the viewport's bottom *is* the moment a
`position: sticky` hero unpins, so keying to it means `--sy` 1 lands on the last
frame the hero is still on screen.

Keyed to the whole runway instead — which is the obvious reading of "progress
through the hero" — the sums do not work. A 175svh runway holding a 100svh sticky
hero unpins at 75svh, which is `--sy` **0.43**: every beat past that plays to an
empty screen while the hero is already sliding away. The symptom is the ball
arriving *after* you have scrolled to the next section, and a parting that never
looks finished because it is only 60% done at the handover.

So the runway's height is the pacing control, and only `height - 100svh` of it
counts. At 340svh that is 240svh to spend:

| | `--sy` | of the pinned window |
|---|---|---|
| parting done | 0.35 | 84svh |
| flags at full swell | 0.41 | 98svh |
| ball across and gone | 0.58 | 140svh |
| next section slides over | 0.58..1 | 140..240svh |
| hero unpins | 1 | 240svh |

The choreography still takes the same 140svh it always did; the extra 100svh is
the next section climbing over a hero that is still pinned underneath, dimmed.

Each `exit` is sized from that layer's own distance to the frame edge in the
worst case — a wide viewport, where the frame shows ~95% of the art and there is
least of it hidden offstage to slide into — plus about 10%. Overshooting is free
but wastes the back of the range: the layer is gone early and the last third of
the scroll does nothing.

The whole thing is a function of `--sy`, so `prefers-reduced-motion` gets none of
it for free — the hook never starts and `--sy` stays 0.

### The ball that crosses it

The handover into the section below: as the scene parts, a flaming cricket ball
crosses the whole screen left to right on a shallow downward line, turning slowly
on its own axis, and is gone by the last frame the hero is pinned for. Nothing
parks — the ball leaves and the next section arrives, in that order, with no dead
beat between them.

**It goes over the border, not under it.** That is what decides where it lives:
`.hero__stage` is the frame's own clip and everything inside it is cut at the
rail, so the ball is a child of `.hero` instead — cut at the viewport, so it
flies in from off-screen and crosses the border on its way. Being a later
sibling is not enough to paint above the frame: size containment on
`.hero__stage` does not scope its children's `z-index`, so `.frame`'s 2 competes
in the hero's stacking context and the ball needs a 3. It is also why `--sy` and
the beats are declared on `.hero` — the ball is outside the stage and would
otherwise inherit none of them.

Its own artwork, [199-156312](https://www.figma.com/design/suWhIOu9YsTu3h65tJePfD/Decathlon?node-id=199-156312),
in `assets/scene/ball.svg`: a redraw of the flaming ball the product grid floats,
flatter and 23 paths against the traced prop's 60-odd. The motion is still
`animateProp` from `sections/propMotion.ts`. Three changes there: `scroller` is
optional, because this one's travel is CSS rather than a scroll drift;
`flicker: false` leaves the flames still, so the ball is the only thing that
moves; and the spin is one slow turn every 12s.

**Paths 0–8 are the ball.** Confirmed by measuring, not by reading the export:
they union to a 337x340 box — square, which is the only shape the disc can be —
and adding path 9 blows it out to 442 wide. Worth re-checking on any re-export:
SVGO collapsed this file from 28 paths to 23 on the way in, and the split
surviving that was luck rather than design.

It rides `--ball`, the last of the three beats, so it crosses over the tail of
the parting rather than alongside it, and its range runs out exactly where the
pinned window does. **The scene falls back as it crosses** —
`opacity: calc(1 - 0.7 * var(--ball))` on `.hero__stage`, border and
illustration alike, so the handover reads as the ball taking the screen and then
the next section arriving over something that has already stepped back. The ball
is outside that box, so it stays at full strength while everything behind it
goes. The travel is written as
`--ball * (100vw + --bw) - --bw`, which puts the ball exactly one of its own
widths off each edge at the two ends whatever the aspect ratio, rather than a
percentage that only clears at some viewport shapes. Size is `min(52vw, 76svh)`
— sized against the shorter axis so on a phone it stays a ball rather than
becoming the screen.

Ids are namespaced on the way in, like every other inlined export — it shares
generated def names with the hero's own layers.

### Gradients across the sections

Every section used to start on black and run to its own end colour, so the page
snapped back to black at each boundary. Now each one **starts on the colour the
section above it ends on**:

| | from | to |
|---|---|---|
| hero | — | `#000` |
| episodes | `#000` | 50% `#7851ae` over `#282828`, so `#503c6b` |
| products | `#503c6b` | `#c52354` |
| line-up | `#c52354` | `#443a72` at 66% |

Chaining the legs rather than running one gradient down `main` keeps every stop
independent of how tall anything is — no section can be resized into a wrong
colour, and a new section only has to know the one above it.

### The next section slides over

Episodes does not push the hero off the top — it climbs over it. `margin-top:
-100svh` puts its top exactly at the point the hero unpins, so it enters the
viewport one screen earlier and spends that screen sliding up a hero that is
still pinned and dimmed behind it. `z-index: 1` because `.hero` is positioned
too and would otherwise win on document order.

That is the whole of it: no scroll handler, no pinning library, one negative
margin against a sticky hero. What it costs is runway — the extra 100svh in the
table above — because the hero has to stay pinned for the whole slide.

**The title lands a letter at a time.** Each character drops in stretched and
tilted and overshoots into place, which is the beat an anime title card hits —
squash and stretch, not a fade. `back.out(2.4)` does the overshoot; the vertical
stretch is what stops it reading as a plain slide up.

The split is in the markup rather than from a plugin: a span per word, a span
per character, and the whole string on the heading's `aria-label` with the spans
`aria-hidden`, so assistive tech gets the sentence and not 19 letters. The word
wrapper earns its place — characters are `inline-block`, so without it every
letter is its own break opportunity and the heading wraps mid-word.

### Character animation

`src/scene/animate.ts`. The traced artwork has no named sub-layers — each player
is a flat list of ~130 paths — so every moving part is declared as a slice of its
layer's paths, together with the bounding box that slice must have. In dev the
slice is verified against it on mount, so a re-export that shifts the indices
warns in the console instead of silently animating an elbow.

| | |
|---|---|
| basketball | turns a little on its own axis — it does not travel |
| dribbling hand | pushes down ~7 units at the wrist, on the ball's period, so the two read as one action |
| bat + arm | bat, both gloves and both forearms rotate together about the elbow: cock back, snap through, settle, beat |
| flags | rotate + skewY + scaleX about the pole, on three unequal periods |
| banners | skewX + rotate + scaleX about the fixing they hang from, mirrored so the pair sway in opposition |

The bat swings from the elbow, not the grip, so the arm goes with it — the part
covers everything outboard of the elbow and the torso stays put. Pivoting at the
grip made the bat look loose in the gloves.

The banners are the flags' trick turned on its side: they hang rather than fly,
so the pivot is the top edge and `skewX` — not `skewY` — is what swings the free
end. Their pivot is measured off the cloth at runtime rather than hardcoded,
because the rest of each banner layer is a stack of 900-unit strips clipped down
to the banner's shape, and those strips' bounding boxes say nothing about where
the banner actually hangs.

The flags were the interesting one. The obvious way to wave a flag is to displace
each of its ~74 checker quads on a phase that lags with distance from the pole —
a real travelling wave. It looks wrong: the quads tile edge to edge, so
neighbours landing on slightly different phases pull the tiling apart and the
grid reads as scrambled rather than waving. The cloth is flexed as a whole
instead, which is affine and so can never break the tiling. `skewY` about the
pole is what does the actual work — it lifts the free end while the attached edge
stays put.

A `feTurbulence` + `feDisplacementMap` ripple was tried first and rejected: it
recomputes per-pixel noise over ~40% of the screen every frame.

### Responsive

The stage covers the viewport in pure CSS — `max()` on both axes against the
1495:903 content box, no resize observer. It is anchored to its **baseline**, so
the crop always comes off the sky, never off the ribbon and foliage.

A 1.66:1 artboard can't be cropped to a phone without throwing the two players
away. So it isn't cropped: `--condense` runs 0 → 1 as the viewport aspect narrows,
and each layer declares how it recomposes — `inward`, `down`, `shrink`, and the
`origin` to scale about. The banners condense *with* the badge rather than sliding
over the wordmark; below 2:3 they drop out entirely. This is the payoff for
splitting the illustration up.

### The frame

From its own board, [195-156186](https://www.figma.com/design/suWhIOu9YsTu3h65tJePfD/Decathlon?node-id=195-156186)
— a clean vector frame, not part of the traced hero export, so it is measured
rather than guessed at.

The rail is **24 units** on a 1572.6-wide board (~1.53vw), split **5 gold / 14
checker / 5 gold**, and it does not simply turn the corner: each corner is a
gold disc of r=56.5 carrying a checkered ring and a magenta centre, and the side
rails stop short and neck into it through a hooked elbow. Top and bottom rails
run flush to the board edge; the side rails run flush to theirs.

That splits cleanly along the same line as before — **four corner tiles plus
four stretchable runs**:

| | |
|---|---|
| `corner.svg` | 4 kB, 116x180 — disc, ring, centre, elbow, and the backdrop that cuts the artwork to the frame's inner edge; mirrored into the other three |
| `.frame__edge` | the straight runs, CSS gradients, inset by the tile size so they start where the tile ends |

The tile is cut by hand from `_figma/frame29/frame29.svg` — the board's `Union`
path (which is the whole rail, clipped by the 116x180 viewBox), the 80px centre
circle, and `Group 45`, the ring, translated to (3, 4). This board is not part of
`root.svg`, so `build_assets.py` does not touch it.

**The tile also carries the crop.** `overflow: clip` on `.hero__stage` cuts the
artwork at the *outer* edge of the rail, which is right along the four straight
runs — they are opaque and flush — but wrong at the corners, where the rail necks
away from the box and the parallax could be seen drifting through the elbow's
notch. So the tile draws a black plate first: the 116x180 box *minus* the rail's
own inner contour, `fill-rule="evenodd"`, taken straight from the second subpath
of `Union`. No second mask to keep in sync — the plate and the gold are cut from
the same curve, so the artwork ends exactly where the frame begins. The one thing
baked in is the colour: `#000`, matching `--c-ink` and the ground outside
`--frame-pad`.

Rebuilt rather than sliced whole so the border sits on the viewport edge at any
aspect ratio instead of being cropped with the illustration. `border-image` would
nine-slice this in one property, but it cannot animate the checker.

The checker band runs. Opposite edges animate in opposite directions so it reads
as one belt circulating clockwise rather than four strips sliding independently.
Ours animates the checker gradient's `background-position` by exactly one pitch,
which loops seamlessly and renders as four thin strips instead of the 500+ nodes
a marquee of repeated tiles would cost. Speed is `--frame-speed`.

**The whole belt moves, rims included.** The medallion rim was 24 static wedges
baked into `corner.svg`; it is now a stroked circle for the same reason the
elbow is a stroked path, which is what lets it run. Its tile is the
circumference over 70 — 4.29052 against the rails' 4.31386 — because a dash only
meets itself cleanly if it divides the circle a whole number of times. Half a
percent is invisible; a seam would not be.

**It runs round the elbows too**, which is the one thing a gradient cannot do.
There the belt is a dashed magenta stroke laid over a solid blue one, both on the
same centreline: the gaps in the dash *are* the blue tiles, so the whole curve is
one animated property (`stroke-dashoffset`, by exactly one tile, so it loops like
the straight runs). Stroke units are viewBox units, so the tile scales with
`--band` on its own.

The centreline is not in the export — the `Union` path gives the elbow as two
edges and nothing down the middle — so `ELBOW` in `Frame.tsx` is those two
averaged control point by control point. Both are four cubics describing the same
turn, so they pair off exactly; they finish at different stations, which leaves
the average about seven units short of the straight rail, and a trailing `L`
carries it down to where the side run's checker starts.

The elbow takes the **side** runs' tile, not the top's — it is the end of a side
rail, and the coarser run along the top is separated from it by the medallion.
And because the belt circulates clockwise, the elbow has to run with the rail it
belongs to: toward the medallion at top-left and bottom-right, away from it at
the other two. Mirroring a path keeps its own direction, so those two carry
`animation-direction: reverse` rather than being handled by the flip.

**The checker is not square, and not the same on both axes** — 10.46 wide on the
horizontal runs, 4.31 on the vertical ones. The board fits the same 137 tiles to
every edge, so the side runs read as fine stripes against the top and bottom's
squares. Kept, because it is what the board shows; `--band-dash-y` is the knob if
it turns out to be a squash rather than a decision. The side runs are stepped
proportionally faster (`--frame-speed x 4.31/10.46`) so the belt still travels at
one speed all the way round.

Two departures from the board:

- **The top and bottom checker starts at the corner tile, not at x=73.** On the
  board it runs *over* the top-left medallion and *under* the other three — the
  ordering is a slip. Starting it at the tile edge leaves clean gold around every
  medallion.
- **No hairline between checker squares.** The old frame had one, from the
  yesnowww reference it was modelled on; this board's tiles abut exactly.

`--band` carries the whole ornament — the disc is 4.7x it and the elbow 7.5x —
but unlike the traced corner it replaced, a circle and a ring survive being thin,
so the band sits at the board's own 1.6vw instead of the 2.6vw the old ornament
needed to stay legible.

The frame sits on `.hero__stage`, inset from the viewport by `--frame-pad`, with
the illustration clipped to that same box — so everything lives inside the border
rather than running under it. That box is a size container, and both the cover
sizing (`cqw`/`cqh`) and the condense breakpoints (`@container`) measure it
rather than the viewport, so changing the padding keeps them correct.

Scene layers are cut to `CONTENT` in `build_assets.py` — the inside of that rail —
so there is no leftover black margin for the thinner web frame to cover.

### Vector line mode

Because the layers are inline, one selector reaches all ~1700 paths:

```css
.stage[data-lines] :is(path, circle, ellipse, rect) { stroke: …; }
```

Try it at `/?lines`. Same hook works for recolouring, per-path animation, or
tinting a layer for a campaign variant — tell me which one you actually meant by
"vector line modification" and I'll build the real control.

## Products

The first screen where the export is worth taking apart rather than flattening.
All six cards share **one** ornament frame, the photography is real, and the copy
is live text — so the card is rebuilt as a component and only its chrome ships as
vector:

| | |
|---|---|
| `card-chrome.svg` | 24 kB, one file for all six — plate rule, corner brackets, checker blocks, sparkles, both logos |
| `*.webp` | the six photos, ~310 kB for the set (they export as ~3 MB of PNG) |
| `prop-*.svg` | the four flaming props that float between the cards |

Figma exports the chrome with the photo still embedded as base64 in `<defs>` —
780 kB of it. `collect_defs` prunes to what the chrome actually references.

The photo is not clipped to a rounded rect: the artwork cuts a twelve-cornered
chamfered window for it, which is reproduced as a percentage `clip-path` so it
scales with the card. Everything else inside the card is a percentage too, so a
card is driven entirely by its column width.

### The flaming props

Each of the four props is a ball plus a trail of flame vectors, inlined (~27 kB
for all four) so the two can move independently:

- the ball spins on its own centre, each at a different speed and direction;
- the flames stay put and flicker — per-path scale, rotation and opacity, each on
  its own random clock so the trail never pulses as one mass;
- the flicker is scaled about the *ball's* centre, not each flame's own, so they
  lick outward from the ball instead of swelling in place;
- a slow lean of the whole trail sits under the flicker;
- the props ride ±25px of scroll drift past the cards, in alternating directions,
  and paint above them.

`ball` in `propMotion.ts` is the list of path indices that make up the ball;
everything else in the file is flame. Football and cricket ball happen to fall on
a colour-group boundary, but the shuttlecock and tennis ball do not — the trace
put the ball's seam in the same group as the flame — so those two are spelled out
by index. All four were confirmed by isolating the set in the browser and looking
at it, which is the only reliable way with art like this.

The pivot is not hardcoded: it is the union bounding box of whatever `ball`
resolves to, so nudging the index list re-centres the spin automatically.

Two deliberate departures from the board:

- **The copy.** Figma repeats the placeholder "CRICK - STRYKE BLACK" on all six
  cards while the photography plainly shows six different tees. The names follow
  the garment in each shot. Cards 4 and 5 both read Spin-Ignite — card 5 is the
  pair shot, and only the Spin-Ignite graphic is visible in it. Swap `PRODUCTS`
  for the real catalogue when there is one.
- **The grid is centred.** The board leaves 78px on the left and 133px on the
  right, which reads as a slip rather than intent.

## Line-up

Modelled on the Decathlon Yestalgia footer list: a column of big titles where
exactly one is open, and scrolling steps the open one down the list. Reuses the
product photos and the card chrome — only the four scattered props are new.

The panel collapses with `grid-template-rows: 0fr` and animates to `1fr`, so it
opens to its natural height with nothing measured in JS.

**Choosing which item is open took three attempts, and the first two are worth
recording because both look obviously correct:**

1. *Nearest item to a trigger line* — the way the reference reads. Unstable: the
   open panel makes its own item about seven times taller than a closed one, so
   whichever item is open stays nearest the line for ever. It never advances.
2. *Measure against the list's top instead* — fixes the feedback, because the
   list's top does not move when a panel inside it opens. But it paces off the
   title height: five items in ~300px of scroll, far too fast to read.
3. *Step from the section's scroll progress* — what ships. Stable, because it
   never reads a height the panels can change, and it paces itself to however
   many items the list has.

The range is a fixed scroll distance (`+= innerHeight`) rather than "until the
section leaves the viewport". Lineup is currently the **last section on the
page**, so its bottom never reaches the top of the viewport and a range keyed to
it stalls halfway — item 4 and 5 never open. `.lineup` carries trailing padding
to make the range reachable; trim it once a section follows.

## Regenerating the artwork

`_figma/root.svg` is the raw export. After re-exporting from Figma:

```bash
npm run assets
```

`build_assets.py` runs SVGO itself at the end. That used to be a separate npm
step, and running the Python file directly then left every folder unminified —
which silently added ~330 kB to the JS bundle, twice, before it was noticed.

`svgo.config.js` keeps `cleanupIds` **off** on purpose — minifying ids to `a`/`b`/`c`
per file makes mask and clipPath references collide once the layers share a
document.

## Known gaps

- The JS bundle is ~281 kB gzipped, nearly all hero path data — the episode cards
  are not in it. If more screens inline artwork, split the hero layers into a
  lazy chunk.
- All five episode cards inlined is ~4,500 extra path nodes on top of the hero's
  ~1,700. They inject lazily, but this is the thing to watch on a mid-range phone.
- The four props run ~80 concurrent GSAP tweens between them (one per flame
  path). Cheap individually, but it is the second thing to profile. The hero's
  ball is one tween rather than twenty — `flicker: false` is why.
- The headline pulls Roboto Flex from Google Fonts. For a European retailer that
  is worth self-hosting before launch; it is a `<link>` swap for an `@font-face`.
- `.hero-runway` is 340svh of empty scroll: 100svh of it is the hero's own height
  and the other 240svh is what --sy is measured over. Replace its height with the
  next real section, but keep the pinned stretch long enough for the scroll-out
  and the slide-over — see "The pinned window" above.
- **Headless screenshots lie about this page.** `layer-in` is `backwards`-filled
  with `animation-delay: depth * 420ms`, and under Chrome's
  `--virtual-time-budget` any layer with a delay past ~200ms is captured still
  sitting on its `opacity: 0` keyframe — so everything from `depth: 0.55` up
  (both players, the foliage, the banners, the flags) is missing from the shot
  and present in a real browser. Disable `animation` on `.layer`, `.layer > svg`
  and `.stage__art` before screenshotting, or you will debug a bug that is not
  there. Driving the page's scroll under virtual time is worse: forcing
  `scrollTo` while Lenis is lerping toward its own target starves the capture and
  you get a frame that is pure `(0,0,0)` — every pixel, not merely dark. The DOM
  is fine at that moment, so `--dump-dom` still tells the truth; the picture does
  not.
- Frame rate is unverified. The browser pane I built this in composites on
  demand, so its rAF is throttled to ~1 fps whether or not anything is animating
   — every approach here was chosen on cost reasoning, not measurement. Worth a
  real profile on a mid-range phone before launch; the flag flutter is six tweens
  on two groups and the players are 23 paths, so the repaint area rather than the
  element count is what to watch.
