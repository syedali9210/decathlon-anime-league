/**
 * Where each garment is actually sold on decathlon.in.
 *
 * Its own module because two sections need it — the catalogue grid and the
 * line-up — and these are real product URLs. The `GROUND` map is duplicated
 * across those same two files quite happily, because it is four words of
 * English grammar that will never change; a store link that goes stale in one
 * section and not the other is a customer landing on the wrong page, so this
 * one is shared.
 *
 * Keyed by SPORT rather than by product id. The two sections give the same
 * garment different ids — `crick-stryke` in the grid, the same in the line-up,
 * but the caps carry ids like `cap-crick-stryke` — while the sport is the one
 * field both agree on for the same physical thing.
 */
const TEE_LINK: Record<string, string> = {
  cricket: 'https://www.decathlon.in/qr/9017680/-1',
  football: 'https://www.decathlon.in/qr/9017681/-1',
  badminton: 'https://www.decathlon.in/qr/9017682/-1',
  tennis: 'https://www.decathlon.in/qr/9017683/-1',
  basketball: 'https://www.decathlon.in/qr/9017684/-1',
}

/**
 * The caps, keyed the same way and one sport short.
 *
 * There is no cricket cap page yet, so the cricket cap in the line-up carries
 * no link. Nothing has to be said about that at either call site: both already
 * render the anchor only when there is a URL, which is what kept every cap
 * linkless while this table did not exist.
 */
const CAP_LINK: Record<string, string> = {
  badminton: 'https://www.decathlon.in/p/9082842/trucker-500-hiking-cap-green-black',
  football: 'https://www.decathlon.in/p/9082843/trucker-500-hiking-cap-green-black',
  basketball: 'https://www.decathlon.in/p/9082844/trucker-500-hiking-cap-green-black',
  tennis: 'https://www.decathlon.in/p/9094632/trucker-500-hiking-cap-green-black',
}

/**
 * Campaign attribution, the same three parameters on every link out of here.
 *
 * Appended on the way out rather than written into the URLs above, for the same
 * reason the kind-to-table rule lives down here: a link that has to be spelled
 * correctly in ten places is a link that will eventually be spelled wrong in
 * one of them. This way a product cannot be added without it, and the tables
 * above stay readable as lists of products.
 */
const TRACKER =
  'utm_source=internal-camp&utm_medium=vercel&utm_campaign=anime-store'

/**
 * The tracker, joined onto whatever query the link already carries.
 *
 * The QR links have none and the collection has `instock=1`; asking rather than
 * assuming costs one character and means a link that does carry a query will
 * not quietly produce a second '?'.
 */
const tracked = (url: string) => `${url}${url.includes('?') ? '&' : '?'}${TRACKER}`

/**
 * The campaign's own aisle, and where every shop errand that is not one product
 * goes: the standing pill, the hero badge's CTA, the deck's EXPLORE links.
 *
 * `instock=1` is the store's filter and belongs to the link — a reader sent to
 * the collection from a poster should not land on a sold-out grid.
 */
export const COLLECTION = tracked(
  'https://www.decathlon.in/c/anime-collection-99478?instock=1',
)

/**
 * The link for one item, or nothing.
 *
 * Which table to read lives here rather than at each call site, so a cap can
 * never pick up its sport's tee link by being passed to the wrong branch.
 */
export const shopLink = (it: { sport: string; kind: string }): string | undefined => {
  const url = (it.kind === 'tee' ? TEE_LINK : CAP_LINK)[it.sport]
  return url && tracked(url)
}
