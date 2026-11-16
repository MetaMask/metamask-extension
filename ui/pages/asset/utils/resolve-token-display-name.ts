/**
 * Picks the token name shown as the details header title.
 *
 * A name that differs from the ticker wins, so the header can show the name
 * with the ticker underneath. The ticker is used when every candidate matches
 * it or is missing.
 *
 * @param symbol - Token ticker
 * @param candidates - Names from asset metadata and token lists, in priority order
 * @returns The title to render
 */
export const resolveTokenDisplayName = (
  symbol: string,
  ...candidates: (string | undefined)[]
): string => {
  const distinctName = candidates.find((candidate) => {
    const trimmed = candidate?.trim();
    return Boolean(trimmed && trimmed !== symbol);
  });

  return distinctName?.trim() || symbol;
};
