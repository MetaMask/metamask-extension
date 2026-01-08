import { GroupedDeFiPositions } from '@metamask/assets-controllers';
import { getTokenAvatarUrl } from './getTokenAvatarUrl';

/**
 * Extracts unique token icons and symbols from nested protocol position data, and orders by ETH or WETH.
 * This function is used within `useMemo` based on `protocolPositions`
 *
 * @param protocolPositions
 */
export const extractUniqueIconAndSymbols = (
  protocolPositions: GroupedDeFiPositions['protocols'][keyof GroupedDeFiPositions['protocols']],
) => {
  if (!protocolPositions?.positionTypes) {
    return [];
  }

  const iconsAndSymbols = Array.from(
    new Map(
      Object.values(protocolPositions.positionTypes)
        .flatMap(
          (displayTokens) =>
            displayTokens?.positions?.flatMap(
              (nestedToken) =>
                nestedToken?.flatMap(
                  (token) =>
                    token?.tokens?.map((underlying) => ({
                      symbol: underlying?.symbol || '',
                      avatarValue: underlying?.iconUrl
                        ? getTokenAvatarUrl(underlying)
                        : '',
                    })) || [],
                ) || [],
            ) || [],
        )
        .filter(Boolean)
        .map((item) => [item.symbol, item]), // Use symbol as the key for uniqueness
    ).values(),
  );

  // Ensure 'ETH' or 'WETH' is at position 1
  const symbolPriority = ['ETH', 'WETH'];
  const firstTokenIndex = iconsAndSymbols.findIndex((item) =>
    symbolPriority.includes(item.symbol),
  );

  if (firstTokenIndex > -1) {
    const [firstItem] = iconsAndSymbols.splice(firstTokenIndex, 1);
    iconsAndSymbols.unshift(firstItem);
  }

  return iconsAndSymbols;
};
