import gsap from "gsap";
import { CSSPlugin } from "gsap/CSSPlugin";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(CSSPlugin, ScrollTrigger);

/**
 * The flaming props: the four that float over the product grid, and the cricket
 * ball that flies into the hero as it scrolls away (Figma 198-156311, which is
 * the same artwork — see `heroball`).
 *
 * Each prop is a ball and a trail of flame vectors, and **only the ball turns**.
 * The flames are part of the drawing, not a separate effect.
 *
 * They used to flicker — every flame vector on its own clock, scaled and rotated
 * about the ball's centre. On traced artwork that pulled the trail apart: the
 * flame is dozens of separate shapes that read as one mass only while they hold
 * their relative positions, so animating them individually scattered them. Hence
 * `flicker: false` on all of them; the option remains for artwork whose flame is
 * a single shape.
 *
 * The bob and its ground shadow are CSS on the <svg> and a pseudo-element (see
 * index.css) — GSAP owns the host's transform for the scroll drift, so the two
 * never write the same property.
 *
 * `ball` lists the path indices that make up the ball — the rest of the file is
 * flame. Only the cricket ball falls on a colour-group boundary. On the other
 * three the trace put ball and flame in the SAME group, because the ball's own
 * markings are drawn in the flame's colour: the football's seams are the pink
 * of its flame, the shuttlecock's skirt the orange of its own, the tennis
 * ball's seam the yellow of its. A group is therefore not a set, and every
 * range here was read off the artwork path by path rather than taken from one.
 *
 * Verified by isolating each index in the browser and looking at it — which is
 * the only way to get these right, and the way the two that were wrong were
 * found: the football was spinning its body out from under its own seams, and
 * the shuttlecock was carrying a lick of flame round with it.
 */
type PropSpec = {
  ball: number[];
  /** Seconds per turn. Signed: negative spins anticlockwise. */
  spin: number;
  /**
   * How far the prop lags or leads the page, as a share of the scroll it takes
   * the section to pass the window. Signed: negative rides up against the
   * scroll, positive trails it. Omit for none.
   *
   * A share, not a pixel count. As a fixed 70px against a pass of nearly three
   * thousand the props were within a couple of per cent of the page's own
   * speed, which is not a parallax — it is the page, carrying them. Written
   * against the pass, the differential holds at any window height and any
   * section length, which is what makes them read as floating rather than
   * pinned to the cards behind them.
   */
  drift?: number;
  /** Flames flicker unless this is false. The hero's ball turns and nothing else. */
  flicker?: boolean;
};

/** Where the catalogue goes two-up; see index.css. */
const REFLOW = 900;

const r = (a: number, b: number) =>
  Array.from({ length: b - a + 1 }, (_, i) => a + i);

export const PROPS: Record<string, PropSpec> = {
  /**
   * 0-8 is the cream body; 9-13 are the pink panel seams drawn ON it, and they
   * are the ball as much as the body is. They used to be left with the flame —
   * the whole pink group was — so the body turned and the seams stayed put, and
   * the ball read as two things sliding over each other. 14-15 are the pink
   * flame that group also holds, and those do stay.
   */
  football: { ball: r(0, 13), spin: 13, drift: -0.09, flicker: false },
  cricketball: { ball: r(0, 8), spin: -9.5, drift: 0.07, flicker: false },
  /**
   * 11-21 is skirt and cork. 22 is a lick of flame that happens to be drawn
   * with them, and including it did two things: it dragged that flame round in
   * a circle, and — because the pivot is the set's own centre — it pulled the
   * pivot off the shuttlecock and out toward the flame, so the shuttle orbited
   * a point beside itself instead of turning on the spot.
   */
  shuttle: { ball: r(11, 21), spin: 17, drift: -0.06, flicker: false },
  tennisball: {
    ball: [2, 3, 4, 13, 14],
    spin: -11,
    drift: 0.08,
    flicker: false,
  },
  /**
   * The hero's crossing ball — its own artwork (Figma 199-156312), not the
   * traced prop above. One slow turn every 12s and nothing else moving: the
   * flames are part of the drawing, not a separate effect, and its travel is
   * the hero's `--ball`, not a drift here.
   */
  heroball: { ball: r(0, 8), spin: -12, flicker: false },
};

function union(paths: SVGPathElement[]) {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const p of paths) {
    const b = p.getBBox();
    x0 = Math.min(x0, b.x);
    y0 = Math.min(y0, b.y);
    x1 = Math.max(x1, b.x + b.width);
    y1 = Math.max(y1, b.y + b.height);
  }
  return { cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, w: x1 - x0, h: y1 - y0 };
}

/**
 * Wires one prop. `scroller` is the element whose scroll range the drift is
 * measured against; omit it for a prop whose travel is driven elsewhere.
 * Returns a teardown.
 */
export function animateProp(
  svg: SVGSVGElement,
  id: string,
  scroller?: Element,
): () => void {
  const spec = PROPS[id];
  if (!spec) return () => {};
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches)
    return () => {};

  const all = [...svg.querySelectorAll("path")] as SVGPathElement[];
  const ball = spec.ball.map((i) => all[i]).filter(Boolean);
  const flames = all.filter((_, i) => !spec.ball.includes(i));

  if (import.meta.env.DEV && ball.length !== spec.ball.length) {
    console.warn(
      `[props] "${id}" resolved ${ball.length} of ${spec.ball.length} ball ` +
        `paths. The prop was probably re-exported; re-check src/sections/propMotion.ts.`,
    );
  }
  if (!ball.length) return () => {};

  // Everything pivots on the ball, including the flames — that is what makes
  // them read as attached to it rather than as a separate shape.
  const { cx, cy, w } = union(ball);
  const svgOrigin = `${cx} ${cy}`;

  const ctx = gsap.context(() => {
    gsap.to(ball, {
      rotation: spec.spin > 0 ? 360 : -360,
      duration: Math.abs(spec.spin),
      ease: "none",
      repeat: -1,
      svgOrigin,
    });

    if (spec.flicker !== false) {
      // Per-flame flicker on its own clock, so the trail never pulses as one mass.
      const rand = gsap.utils.random;
      flames.forEach((f) => {
        const dur = rand(0.36, 0.82);
        gsap.to(f, {
          scale: rand(1.08, 1.22),
          rotation: rand(-5.5, 5.5),
          opacity: rand(0.74, 1),
          duration: dur,
          delay: rand(0, dur),
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
          svgOrigin,
        });
      });

      // A slow lean of the whole flame trail, so the flicker sits on top of
      // something moving rather than jittering in place.
      gsap.to(flames, {
        x: w * 0.03,
        duration: 2.6,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
        svgOrigin,
      });
    }

    // The props do not travel with the page. Over the stretch it takes the
    // section to cross the window they gain or lose a share of it, so they
    // drift against the cards behind them the whole way past.
    //
    // The travel is measured off the same range the trigger uses — the
    // section's height plus a window — so it is a true fraction of the scroll
    // the reader actually spends here. A function value, and `invalidateOnRefresh`
    // with it, so a resize re-measures instead of keeping the old distance.
    if (scroller && spec.drift) {
      // Split either side of where the artwork is placed, rather than running
      // from it: a one-way drift of this size carried the football clean out of
      // the section and over the one above by the time it left. Halved and
      // mirrored, the prop is where the stylesheet puts it at the middle of the
      // pass and travels the same distance up and down from there, so the whole
      // excursion stays inside the padding the section already has.
      const pass = () =>
        (scroller as HTMLElement).offsetHeight + window.innerHeight;
      // Two-up, the props float in the gaps between card rows and each card
      // carries its name and price in the black band at its foot — so the room
      // a ball has before it covers a label is that gap, about 80px. A third of
      // the differential stays inside it, and since the section is little more
      // than half the height there, a third of it still reads as the same
      // drift against the cards.
      const half = () =>
        (spec.drift! * pass() * (window.innerWidth <= REFLOW ? 0.35 : 1)) / 2;
      gsap.fromTo(
        svg.parentElement,
        { y: () => -half() },
        {
          y: () => half(),
          ease: "none",
          scrollTrigger: {
            trigger: scroller,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
            invalidateOnRefresh: true,
          },
        },
      );
    }
  }, svg);

  return () => ctx.revert();
}
