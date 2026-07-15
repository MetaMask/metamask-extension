import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import {
  KnownCaipNamespace,
  type CaipChainId,
  type Hex,
  isCaipChainId,
  parseCaipChainId,
} from '@metamask/utils';
import {
  applyDisplaySign,
  calculateFiatFromMarketRates,
  getHumanReadableTokenAmount,
  getDisplaySignPrefix,
  toMarketRateLookupToken,
} from '../../../../shared/lib/activity/fiat';
import type { TokenAmount } from '../../../../shared/lib/activity/types';
import { convertCaipToHexChainId } from '../../../../shared/lib/network.utils';
import { getCurrentCurrency } from '../../../ducks/metamask/metamask';
import { useFormatters } from '../../../hooks/useFormatters';
import { selectMarketRates } from '../../../selectors/activity';
import { getMultichainShouldShowFiat } from '../../../selectors/multichain';
import { useAppSelector } from '../../../store/hooks';

function resolveHexChainId(
  chainIdForFiat: Hex | CaipChainId | undefined,
): Hex | undefined {
  if (!chainIdForFiat) {
    return undefined;
  }

  if (typeof chainIdForFiat === 'string' && chainIdForFiat.startsWith('0x')) {
    return chainIdForFiat as Hex;
  }

  if (!isCaipChainId(chainIdForFiat)) {
    return undefined;
  }

  try {
    const { namespace } = parseCaipChainId(chainIdForFiat);
    if (namespace === KnownCaipNamespace.Eip155) {
      return convertCaipToHexChainId(chainIdForFiat);
    }
  } catch {
    return undefined;
  }

  return undefined;
}

export function useFormatFiatAmount(
  chainIdForFiat: Hex | CaipChainId | undefined,
) {
  const marketRates = useSelector(selectMarketRates);
  const shouldShowFiat = useAppSelector((state) =>
    chainIdForFiat
      ? getMultichainShouldShowFiat(state, undefined, chainIdForFiat)
      : false,
  );
  const currentCurrency = useSelector(getCurrentCurrency);
  const { formatCurrencyWithMinThreshold } = useFormatters();
  const hexChainId = resolveHexChainId(chainIdForFiat);

  return useCallback(
    (
      primaryToken: TokenAmount | undefined,
      options: { showPlus?: boolean } = {},
    ) => {
      if (!shouldShowFiat || !primaryToken || !hexChainId) {
        return undefined;
      }

      const humanAmount = getHumanReadableTokenAmount(primaryToken);
      const lookupToken = toMarketRateLookupToken(primaryToken, hexChainId);

      if (humanAmount === undefined || !lookupToken) {
        return undefined;
      }

      const fiatMagnitude = calculateFiatFromMarketRates(
        humanAmount,
        lookupToken,
        marketRates,
      );

      if (fiatMagnitude === undefined) {
        return undefined;
      }

      const fiatValue =
        primaryToken.direction === 'out' ? -fiatMagnitude : fiatMagnitude;
      const formattedFiat = formatCurrencyWithMinThreshold(
        fiatValue,
        currentCurrency,
      );
      const signPrefix = getDisplaySignPrefix(primaryToken.direction, {
        showPlus: options.showPlus ?? true,
      });

      return applyDisplaySign(formattedFiat, signPrefix);
    },
    [
      shouldShowFiat,
      hexChainId,
      marketRates,
      currentCurrency,
      formatCurrencyWithMinThreshold,
    ],
  );
}
