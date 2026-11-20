// Space between the typed amount and the symbol that follows it.
export const SYMBOL_GAP_PX = 8;
// Same inset the field uses for its text, so a long amount stops before the symbol.
export const SYMBOL_RIGHT_INSET_PX = 16;

export type SymbolLayout = {
  left: number;
  paddingRight: number;
};

type SymbolLayoutInput = {
  fieldLeft: number;
  fieldWidth: number;
  inputRight: number;
  symbolWidth: number;
  textStart: number;
  textWidth: number;
};

/**
 * Places the token or fiat symbol just after the typed amount, and reports how
 * much right padding the input needs once the symbol is pinned to the field edge.
 *
 * @param input - Measured widths and positions, in pixels, relative to the field.
 * @param input.fieldLeft - Left edge of the field.
 * @param input.fieldWidth - Width of the field.
 * @param input.inputRight - Right edge of the input.
 * @param input.symbolWidth - Width of the symbol.
 * @param input.textStart - Left edge of the typed text, relative to the field.
 * @param input.textWidth - Width of the typed text.
 * @returns The symbol's `left` offset and the input's extra `paddingRight`.
 */
export function getSymbolLayout({
  fieldLeft,
  fieldWidth,
  inputRight,
  symbolWidth,
  textStart,
  textWidth,
}: SymbolLayoutInput): SymbolLayout {
  const naturalLeft = textStart + textWidth + SYMBOL_GAP_PX;
  const maxLeft = fieldWidth - symbolWidth - SYMBOL_RIGHT_INSET_PX;
  const left = Math.round(Math.max(0, Math.min(naturalLeft, maxLeft)));
  const overlaps = naturalLeft > maxLeft;
  // The input is content-box, so this padding is applied as border-box and
  // stays inside the field instead of pushing the digits under the symbol.
  const paddingRight = overlaps
    ? Math.ceil(inputRight - fieldLeft - (left - SYMBOL_GAP_PX))
    : 0;

  return { left, paddingRight };
}
