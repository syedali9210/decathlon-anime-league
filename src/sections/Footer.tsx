import grid from '../assets/footer/grid.svg'
import gridSm from '../assets/footer/grid-sm.svg'
import line from '../assets/footer/line.svg'
import speck from '../assets/footer/speck.svg'
import emblem from '../assets/footer/emblem.svg'
import plaque from '../assets/footer/plaque.svg'
import plaqueSm from '../assets/footer/plaque-sm.svg'
import arch from '../assets/footer/arch.svg'
import archEmpty from '../assets/footer/arch-empty.svg'
import oval from '../assets/footer/oval.svg'
import racket from '../assets/footer/racket.webp'
import artist from '../assets/footer/artist.webp'
import decathlon from '../assets/footer/decathlon.svg'
import decathlonInk from '../assets/footer/decathlon-ink.svg'
import starA from '../assets/footer/star-a.svg'
import starB from '../assets/footer/star-b.svg'
import starC from '../assets/footer/star-c.svg'

/**
 * Figma 325-80. A 1596x804 board: a violet field ruled into a grid, the league
 * emblem in the middle of it, and a handful of pieces pinned around — stars, a
 * plaque, an arched window onto a player, a bat and racket, and the credit card
 * for the collaboration.
 *
 * Positions are percentages of the board, as everywhere else on this site, so
 * one set of numbers holds at every width the board is shown at — but only
 * within one board. There are two: the wide one above, and Figma 328-404, a
 * 402x860 portrait board with its own arrangement, its own grid and a shorter
 * arch with nobody in it. Between them, from 900 down to 560, is a width
 * neither was drawn for, and that band reflows to a wrapped row. All three are
 * in the stylesheet.
 *
 * The pieces the two boards do not share are swapped by <picture>, not by two
 * elements and `display: none` — a hidden <img> is still fetched, and the wide
 * arch is 252kB of traced player that a phone should never download.
 *
 * The grid ITSELF carries the gaps the emblem sits in: the two middle verticals
 * stop at 235 and pick up again at 585, and the horizontal at 399 is a separate
 * piece that resumes to the right of it. That is the board's own drawing, not
 * something to reproduce with a mask.
 */

/** A star: the artwork, where its CENTRE sits, and how wide it is. */
const STARS = [
  { id: 'a1', src: starA, x: 13.22, y: 14.18, w: 3.13 },
  { id: 'b1', src: starB, x: 18.52, y: 17.6, w: 1.79 },
  { id: 'b2', src: starB, x: 58.36, y: 10.51, w: 1.79 },
  { id: 'c1', src: starC, x: 64.93, y: 12.59, w: 2.47 },
  { id: 'a2', src: starA, x: 64.21, y: 26.59, w: 3.13 },
]

const place = (x: number, y: number, w: number) =>
  ({ '--x': `${x}%`, '--y': `${y}%`, '--w': `${w}%` }) as React.CSSProperties

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer__board">
        {/* The ruling. `preserveAspectRatio="none"` in the file, and each board
            holds its own artboard's ratio, so it lands on its own lines. The
            portrait board rules itself differently — closer spacing, its own
            crop — so it carries its own file rather than a squashed copy. */}
        <picture className="footer__grid">
          <source media="(max-width: 560px)" srcSet={gridSm} />
          <img src={grid} alt="" aria-hidden="true" />
        </picture>
        <img
          className="footer__piece footer__line"
          style={place(63.72, 49.63, 36.28)}
          src={line}
          alt=""
          aria-hidden="true"
        />

        {STARS.map((s) => (
          <img
            key={s.id}
            className="footer__piece footer__star"
            style={place(s.x, s.y, s.w)}
            src={s.src}
            alt=""
            aria-hidden="true"
          />
        ))}
        <img
          className="footer__piece footer__speck"
          style={place(61.65, 17.79, 0.19)}
          src={speck}
          alt=""
          aria-hidden="true"
        />

        {/* Very slightly squarer on the portrait board — 99x97 against
            161x165 — and the height follows whichever file loaded. */}
        <picture className="footer__piece footer__plaque" style={place(13.22, 29.1, 10.09)}>
          <source media="(max-width: 560px)" srcSet={plaqueSm} />
          <img src={plaque} alt="" aria-hidden="true" />
        </picture>

        {/* The one piece here that carries words, so it is the one with a name. */}
        <img
          className="footer__piece footer__emblem"
          style={place(38.91, 32.59, 19.42)}
          src={emblem}
          alt="Anime Sports League"
        />
        {/* The portrait board puts the lockup inside the emblem, in ink rather
            than the white the credit card's copy of it is drawn in. Off the
            wide board entirely, which is why it is hidden rather than moved. */}
        <img
          className="footer__piece footer__lockup"
          src={decathlonInk}
          alt="Decathlon"
        />

        {/* Shorter on the portrait board, and with nobody in it. */}
        <picture className="footer__piece footer__arch" style={place(83.46, 29.23, 9.77)}>
          <source media="(max-width: 560px)" srcSet={archEmpty} />
          <img src={arch} alt="" aria-hidden="true" />
        </picture>

        {/* Bat and racket share a box the board clips them to — the racket is
            drawn wider than the box and hangs off its left edge. */}
        <div
          className="footer__piece footer__kit"
          style={place(65.16, 74.75, 7.46)}
          aria-hidden="true"
        >
          <img className="footer__oval" src={oval} alt="" />
          <img className="footer__racket" src={racket} alt="" />
        </div>

        <div className="footer__credit" style={place(13.22, 72.76, 10.15)}>
          {/* The board's own inner column, and the reason it is kept: a
              container does not answer its own queries, so the card's padding
              has to sit on something INSIDE the card to be measured in card
              units. On the card itself it resolved against the board. */}
          <div className="footer__credit-inner">
            <img className="footer__artist" src={artist} alt="" aria-hidden="true" />
            <div className="footer__names">
            {/* The lockup as drawn; the wordmark is wider than the photo above
                it and overhangs the card's own side padding, which is the
                board's arrangement. */}
              <img className="footer__wordmark" src={decathlon} alt="Decathlon" />
              <span className="footer__x">X</span>
              <span className="footer__artist-name">Jolly Yun Shann</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
