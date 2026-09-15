/**
 * Picks a stable hue for a page-object class.
 *
 * The colour has to survive reloads and be the same in the outline and in the
 * tooltip, so it is derived from the name rather than assigned from a palette
 * in discovery order.
 *
 * @param className - The page-object class name.
 * @returns A hue in degrees.
 */
function hueForClass(className: string): number {
  let hash = 0;
  for (let index = 0; index < className.length; index++) {
    hash = (hash * 31 + className.charCodeAt(index)) % 360;
  }
  // Spread neighbouring hashes apart so classes with similar names, which are
  // often siblings, do not come out looking the same colour.
  return (hash * 137) % 360;
}

/**
 * The colour used to label a page object in text.
 *
 * @param className - The page-object class name.
 * @returns An `hsl(...)` colour.
 */
export function colorForClass(className: string): string {
  return `hsl(${hueForClass(className)} 75% 45%)`;
}

/**
 * The translucent fill laid over every element a page object owns, so regions
 * read as areas rather than as a mesh of lines.
 *
 * @param className - The page-object class name.
 * @returns An `hsl(...)` colour with alpha.
 */
export function tintForClass(className: string): string {
  return `hsl(${hueForClass(className)} 75% 50% / 0.1)`;
}
