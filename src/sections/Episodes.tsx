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
 * The section announces itself one line at a time before it shows anything.
 * Each of these takes the middle of the screen alone and clears out before the
 * next arrives — a title card sequence, not a list assembling itself.
 *
 * The claims are repeated from `.episodes__sub` on purpose: this is a
 * presentation of the copy, and the paragraph below is the copy. The relay is
 * `aria-hidden`, so assistive tech reads the sentence once, from the paragraph
 * that stays on the page.
 */
const RELAY = [
  { id: "title", text: TITLE },
  { id: "sports", text: "5 sports" },
  { id: "leagues", text: "5 leagues" },
  { id: "character", text: "One main character" },
  { id: "you", text: "YOU", hot: true },
];

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
 * How the pinned window is divided. The intro takes the front of it, the deal
 * picks up after a short gap, and what is left at the end is the hold that
 * gives the landed deck a beat before the section scrolls on.
 */
const INTRO_SPAN = 0.66;
// The same mark the intro ends on, not a hair after it: the row is revealed by
// the last frame of the intro, and any gap between the two would show the deck
// sitting undealt.
const DEAL_AT = INTRO_SPAN;
const DEAL_SPAN = 0.26;

/**
 * The section announces itself before it shows anything, and it does it one line
 * at a time: the headline rides up from the foot of the screen, lands a letter
 * at a time in the middle of it, and leaves; then each claim takes that same
 * middle alone and clears out for the next; and only when the last of them has
 * gone does the real header rise into its layout place and hand over to the
 * deal.
 *
 * Scrubbed, not played. The beats are the reason the runway is as long as it is,
 * and a visitor scrolling back up should see the sequence run backwards rather
 * than find the section already assembled.
 *
 * The relay is its own stack of slides rather than the header's own elements
 * moved around. Centring the paragraph's spans one at a time would have meant
 * computing a per-span origin, translate and scale to put each in the middle and
 * then unwinding all of it to land back in a two-line paragraph. Five absolutely
 * placed slides that fade in and out cost a few lines of markup and no maths,
 * and the header is left alone to simply arrive at the end.
 */
function useIntroSequence(
  section: React.RefObject<HTMLElement | null>,
  relay: React.RefObject<HTMLElement | null>,
  title: React.RefObject<HTMLElement | null>,
  sub: React.RefObject<HTMLElement | null>,
  choose: React.RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    const el = section.current;
    const stage = relay.current;
    const head = title.current;
    if (!el || !stage || !head) return;
    // The slides are `opacity: 0` in the stylesheet and only this hook lifts
    // them, so bailing out here leaves the page as its layout describes it:
    // relay never seen, header and copy plainly visible.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const runway = el.closest<HTMLElement>(".episodes-runway");
    if (!runway) return;
    const pinned = () => runway.offsetHeight - window.innerHeight;

    const group = [head, sub.current, choose.current].filter(
      Boolean,
    ) as HTMLElement[];
    const row = el.querySelector<HTMLElement>(".episodes__row");

    /**
     * How far below its layout place the header waits. `offsetTop` and not a
     * rect: the section is the offset parent and is pinned to the top of the
     * window, so this is already the headline's position on screen — and unlike
     * a rect it is not affected by the transform this very tween is writing.
     */
    const drop = () =>
      window.innerHeight / 2 - (head.offsetTop + head.offsetHeight / 2);

    const ctx = gsap.context(() => {
      const slides = [
        ...stage.querySelectorAll<HTMLElement>(".episodes__slide"),
      ];
      const [lead, ...claims] = slides;
      if (!lead) return;

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: runway,
          start: "top top",
          end: () => "+=" + pinned() * INTRO_SPAN,
          scrub: 0.6,
          invalidateOnRefresh: true,
        },
      });

      // The header waits out the whole relay, low and invisible. `opacity`
      // rather than `autoAlpha`: the paragraph is the copy of record, and
      // `visibility: hidden` would take it out of the accessibility tree for
      // the length of the sequence.
      //
      // The deck waits with it. Hiding the ROW and not the cards is the whole
      // point: the deal staggers its five targets, so at its own progress 0
      // four of them have not been rendered yet and are sitting exactly where
      // the layout puts them — in a row, in plain sight, behind the titles.
      // Nothing done to the cards can fix that; the container has to go.
      tl.set(row, { autoAlpha: 0 }, 0)
        .set(group, { opacity: 0, y: drop }, 0)
        /**
         * Falls in from above the screen at a size far past its own and settles
         * to it in the middle — the headline arriving rather than fading up.
         * One move on the whole block: a per-character stagger on top of a
         * scale this large reads as two effects fighting, and the scale is the
         * one carrying the beat.
         *
         * `power3.out` because it is an entrance: nearly all the travel happens
         * at the front, so the size is legible almost immediately and the last
         * of the movement is a settle rather than a slide.
         */
        .fromTo(
          lead,
          { autoAlpha: 0, scale: 3.2, y: () => -window.innerHeight * 0.5 },
          { autoAlpha: 1, scale: 1, y: 0, duration: 1.5, ease: "power3.out" },
          0,
        )
        // Held at rest long enough to be read before it goes.
        .to(
          lead,
          { autoAlpha: 0, y: -90, duration: 0.6, ease: "power2.in" },
          2.6,
        );

      // Each claim rises into the middle, holds, and leaves upward — so the
      // whole relay travels one way and reads as a single move rather than
      // four separate entrances.
      const FIRST = 3.5;
      const EVERY = 1.4;
      claims.forEach((c, i) => {
        const at = FIRST + i * EVERY;
        tl.fromTo(
          c,
          { autoAlpha: 0, y: 60 },
          { autoAlpha: 1, y: 0, duration: 0.45, ease: "back.out(1.7)" },
          at,
        ).to(
          c,
          { autoAlpha: 0, y: -60, duration: 0.4, ease: "power2.in" },
          at + 0.72,
        );
      });

      // Everything the relay was standing in for, arriving at once and rising
      // into place — which is what clears the room the deck needs.
      const settle = FIRST + claims.length * EVERY + 0.5;
      tl.to(
        group,
        { opacity: 1, y: 0, duration: 1.1, ease: "power2.out" },
        settle,
      )
        // Handed over on the intro's last frame, which is the frame the deal
        // starts on.
        .set(row, { autoAlpha: 1 }, settle + 1.1);
    }, el);

    return () => ctx.revert();
  }, [section, relay, title, sub, choose]);
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

        gsap.fromTo(
          ".ecard",
          {
            // Measured off the seat, never the card: the card already carries
            // the offset these return, so measuring it feeds back on itself and
            // the pile collapses on the next refresh. The <li> never moves.
            x: (i: number, t: Element) =>
              centreOffset(t) + seat(t).width * (PILE[i]?.dx ?? 0),
            // Below the row and off the foot of the pinned screen, so the deck
            // rises into view rather than being parked in the layout.
            //
            // Only card 0 is ever seen in this state, and only for an instant:
            // a staggered tween has not started its later targets at progress
            // 0, so four of the five carry no transform at all until their turn
            // comes. That is why the ROW is hidden until the deal begins rather
            // than this being asked to park the deck out of sight — it can only
            // ever move the one card GSAP has actually rendered.
            y: (i: number, t: Element) =>
              seat(t).height * (0.95 + (PILE[i]?.dy ?? 0)),
            rotate: (i: number) => PILE[i]?.r ?? 0,
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
            ease: "none",
            stagger: 0.09,
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
              scrub: 0.6,
              invalidateOnRefresh: true,
              onLeave: () => el.toggleAttribute("data-landed", true),
              onEnterBack: () => el.toggleAttribute("data-landed", false),
              // `onLeave` only fires on an actual crossing, so a reload with
              // the browser restoring a scroll position past the deal would
              // leave the deck landed but unflagged — and the shop links,
              // which wait on that flag, invisible for good.
              onRefresh: (self) =>
                el.toggleAttribute("data-landed", self.progress >= 1),
            },
          },
        );
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
          .from(chars, {
            yPercent: 120,
            rotate: -8,
            scaleY: 1.5,
            opacity: 0,
            transformOrigin: "50% 100%",
            duration: 0.45,
            ease: "back.out(2.4)",
            stagger: 0.028,
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
    const read = () =>
      setAt({
        start: el.scrollLeft <= 1,
        end: el.scrollLeft >= el.scrollWidth - el.clientWidth - 1,
      });
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
  const relay = useRef<HTMLDivElement>(null);
  const row = useRef<HTMLUListElement>(null);
  useIntroSequence(section, relay, title, sub, label);
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

        <p className="episodes__sub" ref={sub}>
          5 sports. 5 leagues
          <br />
          One main character &ndash; <em>YOU</em>
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

        {/* Over the pinned screen, not in its flow: the relay has to sit in the
            middle of the window whatever the header underneath it is doing. */}
        <div className="episodes__relay" aria-hidden="true" ref={relay}>
          {RELAY.map((r) => (
            <span
              className="episodes__slide"
              key={r.id}
              data-slide={r.id}
              data-hot={r.hot || undefined}
            >
              {r.text}
            </span>
          ))}
        </div>

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
              </div>
              {/* Under the card, not on it: the poster is the artwork and this
                  is a control. It waits for `data-landed` — the deck's own
                  "dealt and still" flag — because a row of buttons sitting in
                  their final places while the cards are still flying in reads
                  as a broken layout rather than a deliberate one.
                  The name is for assistive tech: five links all called "Shop"
                  are a list of nothing. */}
              <a className="ecard__shop" href={`#tee-${ep.id}`}>
                Shop<span className="sr-only"> {ep.title}</span>
              </a>
            </li>
          ))}
        </ul>

        <DeckNav row={row} />
      </section>
    </div>
  );
}
