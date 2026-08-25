import { useEffect, useRef } from "react";
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
 * The title lands a letter at a time as the section arrives: each character
 * drops in stretched and tilted and overshoots into place, which is the beat an
 * anime title card hits — squash and stretch, not a fade. `back.out` is what
 * does the overshoot; the vertical stretch is what stops it reading as a plain
 * slide.
 *
 * Split per character in the markup rather than by a plugin, with the whole
 * string on the heading's aria-label so assistive tech gets the sentence and not
 * 22 letters.
 */
function useTitleSlam(el: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const host = el.current;
    if (!host) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      gsap.from(".episodes__char", {
        yPercent: 130,
        rotate: -9,
        scaleY: 1.7,
        opacity: 0,
        transformOrigin: "50% 100%",
        duration: 0.55,
        ease: "back.out(2.4)",
        stagger: 0.035,
        scrollTrigger: { trigger: host, start: "top 85%", once: true },
      });
    }, host);

    return () => ctx.revert();
  }, [el]);
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
              start: "top top",
              end: () =>
                "+=" +
                (runway
                  ? runway.offsetHeight - window.innerHeight
                  : window.innerHeight) *
                  0.72,
              scrub: 0.6,
              invalidateOnRefresh: true,
              onLeave: () => el.toggleAttribute("data-landed", true),
              onEnterBack: () => el.toggleAttribute("data-landed", false),
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

export function Episodes() {
  const section = useRef<HTMLElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const label = useRef<HTMLParagraphElement>(null);
  useTitleSlam(title);
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

        <p className="episodes__sub">
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

        <ul className="episodes__row">
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
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
