import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
  KnownCaipNamespace,
  type CaipChainId,
  type Hex,
  parseCaipChainId,
} from '@metamask/utils';
import {
  applyDisplaySign,
  calculateFiatFromMarketRates,
  getHumanReadableTokenAmount,
  getDisplaySignPrefix,
  toMarketRateLookupToken,
} from '../../../shared/lib/activity/fiat';
import type {
  ActivityListItem,
  TokenAmount,
} from '../../../shared/lib/activity/types';
import { convertCaipToHexChainId } from '../../../shared/lib/network.utils';
import { getCurrentCurrency } from '../../ducks/metamask/metamask';
import { useFormatters } from '../../hooks/useFormatters';
import { selectMarketRates } from '../../selectors/activity';
import { getMultichainShouldShowFiat } from '../../selectors/multichain';
import { getActivityTypeSignOptions, shouldShowFiatDisplay } from './helpers';

function resolveHexChainId(
  chainIdForFiat: Hex | CaipChainId | undefined,
): Hex | undefined {
  if (!chainIdForFiat) {
    return undefined;
  }

  if (typeof chainIdForFiat === 'string' && chainIdForFiat.startsWith('0x')) {
    return chainIdForFiat as Hex;
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
  item: ActivityListItem,
  primaryToken: TokenAmount | undefined,
  chainIdForFiat: Hex | CaipChainId | undefined,
) {
  const marketRates = useSelector(selectMarketRates);
  const shouldShowFiat = useSelector((state) =>
    chainIdForFiat
      ? getMultichainShouldShowFiat(state, undefined, chainIdForFiat)
      : false,
  );
  const currentCurrency = useSelector(getCurrentCurrency);
  const { formatCurrencyWithMinThreshold } = useFormatters();
  const token = shouldShowFiatDisplay(item) ? primaryToken : undefined;
  const hexChainId = resolveHexChainId(chainIdForFiat);

  return useMemo(() => {
    if (!shouldShowFiat || !token || !hexChainId) {
      return undefined;
    }

    const humanAmount = getHumanReadableTokenAmount(token);
    const signOptions = getActivityTypeSignOptions(item.type);
    const lookupToken = toMarketRateLookupToken(token, hexChainId);

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
      token.direction === 'out' ? -fiatMagnitude : fiatMagnitude;
    const formattedFiat = formatCurrencyWithMinThreshold(
      fiatValue,
      currentCurrency,
    );
    const signPrefix = getDisplaySignPrefix(token.direction, signOptions);

    return applyDisplaySign(formattedFiat, signPrefix);
  }, [
    shouldShowFiat,
    token,
    item.type,
    hexChainId,
    marketRates,
    currentCurrency,
    formatCurrencyWithMinThreshold,
  ]);
}
