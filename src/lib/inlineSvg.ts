/**
 * Every screen in this Figma file came out of one export session, so their SVGs
 * reuse generated def names — `filter0_d_104_99489` appears in the hero, in each
 * episode card and in the product chrome. Inline two of them into the same
 * document and the second resolves the first's defs, which renders as a black
 * rectangle or nothing at all.
 *
 * Prefixing on the way in is the whole fix. One pass covers the three forms an
 * id reference takes in a Figma export.
 */
export function namespaceIds(svg: string, prefix: string) {
  return svg.replace(
    /\b(id="|url\(#|href="#)([^"')]+)/g,
    (_, lead: string, id: string) => `${lead}${prefix}${id}`,
  )
}
