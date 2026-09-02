import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import spinIgnite from "../assets/episodes/spin-ignite.svg";
import skySmash from "../assets/episodes/sky-smash.svg";
import crickStryke from "../assets/episodes/crick-stryke.svg";
import apexKick from "../assets/episodes/apex-kick.svg";
import rimCrush from "../assets/episodes/rim-crush.svg";
import backSpinIgnite from "../assets/episodes/back-spin-ignite.svg";
import backSkySmash from "../assets/episodes/back-sky-smash.svg";
import backCrickStryke from "../assets/episodes/back-crick-stryke.svg";
import backApexKick from "../assets/episodes/back-apex-kick.svg";
import backRimCrush from "../assets/episodes/back-rim-crush.svg";
import { animateCard } from "./episodeParts";
import { namespaceIds } from "../lib/inlineSvg";
import { scrollToSection } from "../lib/useParallax";

gsap.registerPlugin(ScrollTrigger);

/**
 * This section grows after it first lays out — the posters are fetched and
 * injected per card, and the headline's font lands late — so any trigger
 * measured before that is stale. Left alone the deck read as already dealt at
 * the top of the page: its end had been computed against a document that had
 * not finished growing. Coalesced to one refresh a frame, because five cards
 * injecting would otherwise force five full recalculations.
 */
let queued = 0;
function refreshTriggers() {
  cancelAnimationFrame(queued);
  queued = requestAnimationFrame(() => ScrollTrigger.refresh());
}

const TITLE = "Welcome to the anime world";

/**
 * Where a poster leads: its OWN tee, down in the catalogue.
 *
 * The grid has carried `tee-<id>` on every card for exactly this, and the five
 * episode ids are the same five product ids. Every card used to land on the
 * ground section instead — one destination for all five, which made the poster
 * a scroll button rather than a way to the thing it is a poster for.
 *
 * The catalogue falls back to itself if an id ever stops matching, because a
 * control that does nothing at all when clicked is worse than one that lands a
 * little wide.
 */
const teeTarget = (id: string) =>
  document.getElementById(`tee-${id}`) ??
  document.querySelector<HTMLElement>(".products");

/** The eight-pointer from `card-chrome.svg`, flanking the divider as on the board. */
/** The divider label cycles through these, forever. */
const PHRASES = [
  "Choose your league",
  "Find your sport.",
  "Unlock your power.",
];

const SPARK =
  "m212.15 11-1.19 11.72-8.52-5.13 5.2 7.57L197 27.61l11.12 2.2-5.68 7.57L210.5 " +
  "32l2.13 11 2.13-11 7.57 5.38-5.2-7.57L228 27.6l-10.88-2.45 5.2-7.57-8.04 5.13z";

const EPISODES = [
  {
    id: "spin-ignite",
    src: spinIgnite,
    title: "Spin-Ignite",
    sport: "tennis",
    back: backSpinIgnite,
  },
  {
    id: "sky-smash",
    src: skySmash,
    title: "Sky-Smash",
    sport: "badminton",
    back: backSkySmash,
  },
  {
    id: "crick-stryke",
    src: crickStryke,
    title: "Crick-Stryke",
    sport: "cricket",
    back: backCrickStryke,
  },
  {
    id: "apex-kick",
    src: apexKick,
    title: "Apex-Kick",
    sport: "football",
    back: backApexKick,
  },
  {
    id: "rim-crush",
    src: rimCrush,
    title: "Rim-Crush",
    sport: "basketball",
    back: backRimCrush,
  },
];

/**
 * Cards are fetched and inlined rather than left as <img> because one prop in
 * each has to be animated, and that needs the paths in the DOM. Fetching keeps
 * 1.3 MB of traced art out of the JS bundle — it stays a cached asset — and the
 * observer defers both the request and the parse until the row is near view.
 */
function Card({ ep }: { ep: (typeof EPISODES)[number] }) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let stop: (() => void) | undefined;
    let cancelled = false;

    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        fetch(ep.src)
          .then((r) => r.text())
          .then((text) => {
            if (cancelled) return;
            el.innerHTML = namespaceIds(text, `${ep.id}-`);
            const svg = el.querySelector("svg");
            if (!svg) return;
            svg.removeAttribute("width");
            svg.removeAttribute("height");
            svg.setAttribute("role", "img");
            svg.setAttribute(
              "aria-label",
              `${ep.title} — ${ep.sport} episode poster`,
            );
            stop = animateCard(svg, ep.id);
            refreshTriggers();
          })
          .catch(() => {});
      },
      { rootMargin: "300px" },
    );
    io.observe(el);

    return () => {
      cancelled = true;
      io.disconnect();
      stop?.();
    };
  }, [ep]);

  return <div className="episodes__art" ref={host} />;
}

/**
 * How the pinned window is divided, now that the deal is the only thing in it.
 *
 * The header used to take nearly half of this — the relay was scrubbed, so its
 * beats had to be BOUGHT in scroll — and that was the extra length the section
 * carried. The header plays on its own clock and spends nothing, so the front
 * of the window is a short beat to read it in and the rest is the deal.
 */
// Just enough that the header is read before the first card moves, rather than
// the deal starting under it.
const DEAL_AT = 0.06;
// The deal is the only thing left that needs scroll, so it takes nearly all of
// it.
//
// Smoothness in a scrubbed animation is not an easing choice, it is scroll
// distance per unit of motion — and each card here moves a long way: most of a
// card width across, most of a card height up, eighteen degrees of tilt, a
// scale, and a hundred and eighty degrees of flip. Squeezed into a short range
// that cannot be smooth however it is eased, because the reader's own scroll
// resolution becomes the frame rate. So the range keeps widening: 0.62, then
// 0.75, now 0.82 of a window that is itself longer — about 800px of scroll for
// the deal where it started with 458.
// What remains at the end is the hold that gives the landed deck a beat before
// the section scrolls on.
const DEAL_SPAN = 0.82;

/**
 * The header arrives, all of it at once.
 *
 * This used to be a relay: five title cards taking the middle of an otherwise
 * empty screen one at a time, the headline and then each claim in turn, with the
 * real header rising into place only after the last of them had gone. It was
 * seven seconds of reading one line at a time before the section showed
 * anything, and it cost the runway most of its length to hold.
 *
 * Now the headline, the claims and the divider label simply appear together and
 * stay. The animation is on the LETTERS — the title is already split per
 * character for it — so it reads as type being set rather than a box fading up,
 * and the block still arrives as one event.
 *
 * `from`, not `fromTo`: the landed state is what the stylesheet already
 * describes, so nothing here has to put it back, and the page without this hook
 * is the page with the header plainly visible. ScrollTrigger renders the `from`
 * values immediately, so there is no flash of the finished header before it
 * plays.
 */
function useHeaderReveal(
  section: React.RefObject<HTMLElement | null>,
  title: React.RefObject<HTMLElement | null>,
  sub: React.RefObject<HTMLElement | null>,
  choose: React.RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    const el = section.current;
    const head = title.current;
    if (!el || !head) return;
    // Bailing out leaves the page as its layout describes it: header and copy
    // plainly visible, nothing hidden waiting for a tween that never runs.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const runway = el.closest<HTMLElement>(".episodes-runway");
    if (!runway) return;

    const ctx = gsap.context(() => {
      const chars = head.querySelectorAll<HTMLElement>(".episodes__char");
      const rest = [sub.current, choose.current].filter(Boolean);

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: runway,
          // Not `top top`. Waiting for the runway to reach the top of the window
          // meant waiting for the hero to finish sliding off it, and the whole
          // of that slide showed an empty screen coming up underneath. Started
          // as the runway comes into view instead, so the two sections hand
          // over.
          start: "top 78%",
          // Played on its own clock; scroll only says when. Reset on the way
          // back up so a reader who scrolls back sees it set itself again.
          toggleActions: "play none none reset",
          invalidateOnRefresh: true,
        },
      });

      // A tight stagger across the characters — 18ms, so twenty-six of them take
      // under half a second and the line reads as one word arriving rather than
      // as letters queueing. The copy under it follows while the last few are
      // still landing, which is what keeps the whole header one event.
      //
      // `expo.out` and these durations are not chosen here, they are the
      // stylesheet's: every other section on the page arrives on
      // `cubic-bezier(0.16, 1, 0.3, 1)` over 500-720ms — see the `[data-shown]`
      // rules — and that curve IS expo-out. This was the one entrance on the
      // page running a different, weaker one, which is why the headline settled
      // more slowly than the sections either side of it. Strong ease-out is
      // also the right shape for the job: almost all of the distance covered
      // immediately, then a long settle, so the type reads as arriving rather
      // than as travelling.
      tl.from(chars, {
        autoAlpha: 0,
        y: 26,
        duration: 0.62,
        ease: "expo.out",
        stagger: 0.018,
      }).from(
        rest,
        {
          autoAlpha: 0,
          y: 18,
          duration: 0.56,
          ease: "expo.out",
          stagger: 0.08,
        },
        0.3,
      );
    }, el);

    return () => ctx.revert();
  }, [section, title, sub, choose]);
}

/**
 * The pile, from Figma 245-2: offsets as fractions of a card so it scales, and
 * a lean per card. Derived from the board's five rotated frames — their reported
 * boxes are axis-aligned bounds of a 248x379 card, which gives back the angle.
 * Order is row order; the board's own stacking order is not recoverable from
 * bounds alone, so the fan is matched in character rather than card for card.
 */
const PILE = [
  { dx: -0.42, dy: 0.03, r: -15 },
  { dx: 0.49, dy: -0.08, r: 11 },
  { dx: -0.64, dy: 0.23, r: -8 },
  { dx: 0.26, dy: 0.05, r: 18 },
  { dx: 0.63, dy: 0.19, r: -16 },
];

/**
 * The deck deals itself out. The cards sit in their normal row positions in the
 * DOM and the *stacked* state is an offset applied at progress 0 — interpolating
 * a transform back to identity, rather than animating layout, which keeps the
 * row responsive for free and means the landed state is just "no transform".
 *
 * The offsets are function-based and the trigger refreshes on resize, so the
 * pile re-forms on the row's real centre at any width instead of a baked pixel
 * value, and sits a fraction of a card below the row — capped at the room the
 * section actually has left, which is what keeps it off the section below.
 *
 * The section is pinned while this happens — a tall runway with a sticky screen
 * inside it, the same shape the hero uses. Without the pin the deal ran against
 * a section that was still travelling, so the cards reached their positions and
 * were immediately carried off the top of the screen. Pinned, they land in the
 * middle of the viewport and stay there.
 *
 * The deal takes the first 0.72 of the pinned window; the rest is the hold that
 * gives the landed deck a beat before the section scrolls on.
 *
 * `rotateY` to 180 is the flip: the faces are back-to-front inside the card, so
 * one rotation both turns the card over and reveals the poster.
 */
function useCardDeal(section: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = section.current;
    if (!el) return;
    const row = el.querySelector<HTMLElement>(".episodes__row");
    if (!row) return;

    // `gsap.matchMedia`, not a one-off check at mount: the decision has to be
    // revisited whenever the viewport crosses the breakpoint. Checked once, a
    // page loaded narrow and then widened kept the deck sat down for good,
    // because the effect never re-ran.
    const mm = gsap.matchMedia();

    // Reduced motion, and the narrow breakpoint where the row is a scroll
    // container: both get the landed state outright — dealt, face up, still.
    // A scroll container clips, and the deal needs to move cards out of the row.
    mm.add("(max-width: 640px), (prefers-reduced-motion: reduce)", () => {
      const cards = el.querySelectorAll<HTMLElement>(".ecard");
      el.toggleAttribute("data-landed", true);
      cards.forEach((c) => {
        c.style.transform = "rotateY(180deg)";
      });
      return () => {
        el.toggleAttribute("data-landed", false);
        cards.forEach((c) => {
          c.style.transform = "";
        });
      };
    });

    mm.add(
      "(min-width: 641px) and (prefers-reduced-motion: no-preference)",
      () => {
        const seat = (card: Element) =>
          card.closest(".episodes__card")!.getBoundingClientRect();
        const centreOffset = (card: Element) => {
          const r = row.getBoundingClientRect();
          const b = seat(card);
          return r.left + r.width / 2 - (b.left + b.width / 2);
        };
        const runway = el.closest<HTMLElement>(".episodes-runway");
        const cards = [...el.querySelectorAll<HTMLElement>(".ecard")];

        // Where card `i` sits in the pile, in one place, because two things
        // need the same answer: the tween that deals it out, and the resting
        // style below that holds it there until the tween takes over.
        //
        // Measured off the seat, never the card: the card already carries the
        // offset this returns, so measuring it feeds back on itself and the
        // pile collapses on the next refresh. The <li> never moves.
        const pileOf = (card: Element, i: number) => ({
          x: centreOffset(card) + seat(card).width * (PILE[i]?.dx ?? 0),
          // Below the row and off the foot of the pinned screen, so the deck
          // rises into view rather than being parked in the layout.
          y: seat(card).height * (0.95 + (PILE[i]?.dy ?? 0)),
          r: PILE[i]?.r ?? 0,
        });

        /**
         * The pile, written as each card's own resting transform — see `.ecard`
         * in the stylesheet, which hands `--pile` to `transform` whenever GSAP
         * has not written one of its own.
         *
         * This is what stops the deck reading as already dealt. A staggered
         * tween has not started its later targets at progress 0, and
         * `invalidateOnRefresh` clears the start values it rendered when it was
         * built — so four of the five cards carried NO transform and sat in the
         * row, face down, where the layout puts them, until their turn came and
         * they jumped down into a pile the reader had never seen. Nothing inside
         * the tween can fix that: the tween is exactly what is not running for
         * those cards.
         *
         * Safe to re-run at any moment, which is why the refresh below simply
         * calls it: it writes a custom property, never `transform`, so a card
         * the deal is currently moving does not notice.
         */
        const park = () =>
          cards.forEach((c, i) => {
            const p = pileOf(c, i);
            c.style.setProperty(
              "--pile",
              `translate(${p.x}px, ${p.y}px) rotate(${p.r}deg) scale(0.82)`,
            );
          });
        park();

        // The row still waits out of sight until the deal begins, but only so
        // the pile is not sat under the header while the reader is reading it.
        gsap.set(row, { autoAlpha: 0 });

        gsap.fromTo(
          cards,
          {
            x: (i: number, t: Element) => pileOf(t, i).x,
            y: (i: number, t: Element) => pileOf(t, i).y,
            rotate: (i: number, t: Element) => pileOf(t, i).r,
            rotateY: 0,
            scale: 0.82,
            transformPerspective: 1400,
          },
          {
            x: 0,
            y: 0,
            rotate: 0,
            rotateY: 180,
            scale: 1,
            // `power1.inOut`, not `none`. Linear is the usual default under a
            // scrub — the scroll is already the clock, so an ease can only
            // fight it — but that reasoning holds for ONE tween mapped to a
            // range. This is five, staggered, and each card's own share of the
            // range is short: linear meant every card started at full speed and
            // stopped dead, five times over, which is the hard edge that read
            // as snapping. Easing in and out of each card's own window smooths
            // the ends without touching where the scroll puts them, and it only
            // ever settles — no overshoot to replay when the reader drags back.
            ease: "power1.inOut",
            // A touch more separation now there is more room to spend it in.
            stagger: 0.11,
            scrollTrigger: {
              // The pinned window: the runway's top reaching the top of the
              // viewport until its bottom reaches the bottom, which is exactly
              // the stretch the sticky section is stuck for.
              trigger: runway ?? row,
              // Picks up where the intro leaves off rather than at the top of
              // the pinned window — the headline and its claims have the front
              // of it to themselves.
              start: () =>
                "top top-=" +
                (runway ? (runway.offsetHeight - window.innerHeight) * DEAL_AT : 0),
              end: () =>
                "+=" +
                (runway
                  ? runway.offsetHeight - window.innerHeight
                  : window.innerHeight) *
                  DEAL_SPAN,
              // Scrub is not the deal's speed — the range is — but it is what
              // decides whether the deck glides to the scroll position or is
              // dragged frame by frame with it. At 0.6 every twitch of a
              // trackpad arrived in the cards; 1.6 is enough catch-up to
              // swallow a wheel's steps without the deck feeling detached from
              // the hand moving it.
              scrub: 1.6,
              invalidateOnRefresh: true,
              // The other end of the hide above: the row comes back the moment
              // the deal starts, which is the first frame a card is anywhere
              // other than where the layout puts it.
              // Faded, not switched. The pile's top edge sits inside the
              // viewport at progress 0, so a hard `set` here was a strip of
              // card tops appearing out of nothing at the foot of the screen —
              // small, but the exact kind of cut the deal exists to avoid.
              onEnter: () =>
                gsap.to(row, { autoAlpha: 1, duration: 0.3, ease: "power2.out" }),
              onLeave: () => el.toggleAttribute("data-landed", true),
              onEnterBack: () => el.toggleAttribute("data-landed", false),
              // `onEnter` and `onLeave` only fire on an actual crossing, so a
              // reload with the browser restoring a scroll position past the
              // deal would leave the deck landed but unflagged — the shop
              // links, which wait on that flag, invisible for good — and the
              // row hidden, because nothing had entered it. Progress is the
              // truth in both cases, and it is known on every refresh.
              //
              // `park` rides along because a refresh is exactly when the row's
              // centre and the card's size may have changed underneath it.
              onRefresh: (self) => {
                park();
                gsap.set(row, { autoAlpha: self.progress > 0 ? 1 : 0 });
                el.toggleAttribute("data-landed", self.progress >= 1);
              },
            },
          },
        );

        return () => cards.forEach((c) => c.style.removeProperty("--pile"));
      },
      el,
    );

    // Fonts and the late-injected posters both change the height these triggers
    // were measured against.
    document.fonts?.ready.then(refreshTriggers);
    if (document.readyState !== "complete") {
      window.addEventListener("load", refreshTriggers, { once: true });
    }

    return () => {
      window.removeEventListener("load", refreshTriggers);
      mm.revert();
    };
  }, [section]);
}

/**
 * The divider label, cycling. Each phrase lands a character at a time and leaves
 * the same way, on the beat the headline uses — `back.out` overshoot with a
 * vertical stretch, so it reads as the same piece of design rather than a
 * generic crossfade.
 *
 * All three phrases sit in one grid cell, so the container is always as wide as
 * the longest of them and the rules either side never shift as the text
 * changes. They are `aria-hidden` behind a single stable label: a live region
 * announcing three slogans on a loop would be hostile.
 */
function useLabelCycle(host: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const phrases = [
      ...el.querySelectorAll<HTMLElement>(".episodes__phrase"),
    ];
    if (!phrases.length) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // No cycling at all — one phrase, held.
      phrases.forEach((p, i) => {
        p.style.visibility = i ? "hidden" : "visible";
      });
      return;
    }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ repeat: -1 });
      phrases.forEach((p) => {
        const chars = p.querySelectorAll(".episodes__char");
        tl.set(p, { autoAlpha: 1 })
          // This one IS played rather than scrubbed, so it keeps its
          // overshoot. The stretch comes down from 1.5: a glyph at half again
          // its height is re-rasterised every frame, and twenty of them at once
          // is what made the label judder where the rest of the cycle did not.
          .from(chars, {
            yPercent: 120,
            rotate: -8,
            scaleY: 1.2,
            opacity: 0,
            transformOrigin: "50% 100%",
            duration: 0.45,
            ease: "back.out(2.2)",
            stagger: 0.028,
            force3D: true,
          })
          // A gap on the position parameter rather than a tween on {}: an empty
          // target inherits the timeline defaults and GSAP rightly rejects it.
          .to(
            chars,
            {
              yPercent: -110,
              opacity: 0,
              duration: 0.3,
              ease: "power2.in",
              stagger: 0.02,
            },
            "+=2.4",
          )
          .set(p, { autoAlpha: 0 });
      });
    }, el);

    return () => ctx.revert();
  }, [host]);
}

/**
 * Below 640px the row is a snap carousel — `useCardDeal` sits the deck down face
 * up there rather than dealing into a box that scrolls — and a row that scrolls
 * sideways with no affordance is a row most people never scroll. These are that
 * affordance: one card per press, and the snap does the landing.
 *
 * The step is measured off a real card rather than assumed, so it stays correct
 * at whichever of the two widths `.episodes__card` resolves to.
 */
function DeckNav({ row }: { row: React.RefObject<HTMLUListElement | null> }) {
  const [at, setAt] = useState({ start: true, end: false });

  useEffect(() => {
    const el = row.current;
    if (!el) return;
    // A pixel of slack: scrollLeft is fractional once the snap has landed.
    // Returns the SAME object when neither end has changed, which is React's
    // signal to skip the render. Handing back a fresh one every time re-rendered
    // the nav on every scroll event of a drag — dozens a second, to set two
    // booleans to the values they already held.
    const read = () => {
      const start = el.scrollLeft <= 1;
      const end = el.scrollLeft >= el.scrollWidth - el.clientWidth - 1;
      setAt((prev) =>
        prev.start === start && prev.end === end ? prev : { start, end },
      );
    };
    read();
    el.addEventListener("scroll", read, { passive: true });
    window.addEventListener("resize", read);
    return () => {
      el.removeEventListener("scroll", read);
      window.removeEventListener("resize", read);
    };
  }, [row]);

  const page = (dir: 1 | -1) => {
    const el = row.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>(".episodes__card");
    const gap = parseFloat(getComputedStyle(el).columnGap) || 0;
    const step = card ? card.offsetWidth + gap : el.clientWidth;
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  return (
    <div className="episodes__nav">
      <button
        className="episodes__arrow"
        type="button"
        onClick={() => page(-1)}
        disabled={at.start}
        aria-label="Previous episode"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M15 4 7 12l8 8" />
        </svg>
      </button>
      <button
        className="episodes__arrow"
        type="button"
        onClick={() => page(1)}
        disabled={at.end}
        aria-label="Next episode"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="m9 4 8 8-8 8" />
        </svg>
      </button>
    </div>
  );
}

export function Episodes() {
  const section = useRef<HTMLElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const label = useRef<HTMLParagraphElement>(null);
  const sub = useRef<HTMLParagraphElement>(null);
  const row = useRef<HTMLUListElement>(null);
  useHeaderReveal(section, title, sub, label);
  useCardDeal(section);
  useLabelCycle(label);

  return (
    // The runway is what the deck is pinned against; the section sticks to it
    // for the deal and the hold, then scrolls on. Same shape as the hero.
    <div className="episodes-runway">
      <section
        className="episodes"
        ref={section}
        aria-labelledby="episodes-title"
      >
        <h2
          className="episodes__title"
          id="episodes-title"
          ref={title}
          aria-label={TITLE}
        >
          {TITLE.split(" ").map((word, w) => (
            <span key={w} aria-hidden="true">
              {w > 0 && " "}
              <span className="episodes__word">
                {[...word].map((ch, c) => (
                  <span className="episodes__char" key={c}>
                    {ch}
                  </span>
                ))}
              </span>
            </span>
          ))}
        </h2>


        {/* Figma 239-156472. Two lines with a gap rather than one paragraph
            broken by a rule — the board sets them as separate blocks — and YOU
            carries its own colour. Not to be confused with the copy that used
            to sit here as well: that one belongs on the hero's medallion, and
            is printed on it. */}
        <p className="episodes__sub" ref={sub}>
          <span>5 sports. 5 leagues</span>
          <span>
            One main character &ndash; <em>YOU</em>
          </span>
        </p>
        <p className="episodes__choose" ref={label} aria-label={PHRASES[0]}>
          <svg
            className="episodes__spark"
            viewBox="197 11 31 32"
            aria-hidden="true"
          >
            <path d={SPARK} fill="currentColor" />
          </svg>
          <span className="episodes__cycle">
            {PHRASES.map((phrase) => (
              <span className="episodes__phrase" key={phrase} aria-hidden="true">
                {[...phrase].map((ch, c) => (
                  <span className="episodes__char" key={c}>
                    {ch === " " ? " " : ch}
                  </span>
                ))}
              </span>
            ))}
          </span>
          <svg
            className="episodes__spark"
            viewBox="197 11 31 32"
            aria-hidden="true"
          >
            <path d={SPARK} fill="currentColor" />
          </svg>
        </p>

        <ul className="episodes__row" ref={row}>
          {EPISODES.map((ep) => (
            <li className="episodes__card" key={ep.id}>
              {/* Float on the outside, deal on the inside: two owners of one
                transform is the bug that keeps costing an afternoon. */}
              <div className="ecard__float">
                <div className="ecard">
                  <img
                    className="ecard__face ecard__face--back"
                    src={ep.back}
                    alt=""
                  />
                  <div className="ecard__face ecard__face--front">
                    <Card ep={ep} />
                  </div>
                </div>
                {/* The whole poster is a hit area for the same errand the
                    pill below it names. Laid over the card rather than wrapped
                    around it: `.ecard` carries both the deal's transform and
                    the flip, and a <button> in that chain would be a third
                    owner of the same property.

                    Out of the tab order and out of the accessibility tree, and
                    it has no name for the same reason: the pill under the card
                    is the announced control, and offering the same trip twice
                    per card — ten stops to five destinations — is a worse read
                    than one clear one. This is here so that clicking the
                    artwork does what the artwork looks like it should do. */}
                <button
                  className="ecard__jump"
                  type="button"
                  tabIndex={-1}
                  aria-hidden="true"
                  onClick={() => {
                    const tee = teeTarget(ep.id);
                    if (tee) scrollToSection(tee);
                  }}
                />
              </div>
              {/* Under the card, not on it: the poster is the artwork and this
                  is a control. It waits for `data-landed` — the deck's own
                  "dealt and still" flag — because a row of buttons sitting in
                  their final places while the cards are still flying in reads
                  as a broken layout rather than a deliberate one.

                  A button, not a link off to Decathlon. Exploring an episode
                  means going to see its garment, and that lives one section
                  down this page — the store is where the catalogue card sends
                  you, once you have looked at it. Which also means the reader
                  is never thrown into a new tab from the middle of a scroll
                  sequence they are halfway through.

                  The name is for assistive tech: five buttons all called
                  "Explore" are a list of nothing. */}
              <button
                className="ecard__shop"
                type="button"
                onClick={() => {
                  const tee = teeTarget(ep.id);
                  if (tee) scrollToSection(tee);
                }}
              >
                Explore
                <span className="sr-only"> the {ep.title} tee, below</span>
              </button>
            </li>
          ))}
        </ul>

        <DeckNav row={row} />
      </section>
    </div>
  );
}
