/**
 * Where each tee is actually sold on decathlon.in.
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
 * Campaign attribution, the same three parameters on every product link.
 *
 * Appended on the way out rather than written into the URLs above, for the same
 * reason the tees-only rule lives down here: a link that has to be spelled
 * correctly in five places is a link that will eventually be spelled wrong in
 * one of them. This way a product cannot be added without it, and the table
 * above stays readable as a list of products.
 */
const TRACKER =
  'utm_source=internal-camp&utm_medium=vercel&utm_campaign=anime-store'

/**
 * The link for one item, or nothing.
 *
 * The tees-only rule lives here rather than at each call site, so a cap can
 * never pick up its sport's tee link by being passed to the wrong branch. There
 * are no cap product pages yet; when there are, this is the one place that has
 * to learn about them — and they will carry the tracker without being asked.
 */
export const shopLink = (it: { sport: string; kind: string }): string | undefined => {
  const url = it.kind === 'tee' ? TEE_LINK[it.sport] : undefined
  // The QR links carry no query of their own today, but joining on what is
  // actually there costs one character and means pasting in a link that does
  // will not quietly produce a second '?'.
  return url && `${url}${url.includes('?') ? '&' : '?'}${TRACKER}`
}
