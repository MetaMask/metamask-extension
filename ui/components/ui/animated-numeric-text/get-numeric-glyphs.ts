export type NumericGlyph = {
  character: string;
  key: string;
};

/**
 * Gives digits stable left-to-right identities so appending or removing a
 * digit keeps the existing glyphs mounted. Group separators use their own
 * identities, allowing them to enter or exit while surrounding digits slide
 * into their new positions.
 *
 * Ported from Mobile `AnimatedNumericText.tsx`. A digit's key includes its
 * character, so replacing a digit exits the old glyph and enters the new one.
 *
 * @param value - The numeric run from `splitNumericString`.
 * @returns One keyed glyph per character.
 */
export const getNumericGlyphs = (value: string): NumericGlyph[] => {
  let digitIndex = 0;
  const separatorOccurrences = new Map<string, number>();

  return Array.from(value).map((character) => {
    if (/\d/u.test(character)) {
      const glyph = {
        character,
        key: `digit-${digitIndex}-${character}`,
      };
      digitIndex += 1;
      return glyph;
    }

    const occurrence = separatorOccurrences.get(character) ?? 0;
    separatorOccurrences.set(character, occurrence + 1);

    return {
      character,
      key: `separator-${character.codePointAt(0) ?? 0}-${occurrence}`,
    };
  });
};
