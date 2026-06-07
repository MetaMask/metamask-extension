import React, { useCallback, useMemo } from 'react';
import {
  Button,
  ButtonSize,
  ButtonVariant,
} from '@metamask/design-system-react';
import type { TokenAmount } from '../../../../shared/lib/activity/types';
import { getHumanReadableTokenAmount } from '../../../../shared/lib/activity/fiat';
import { BridgeQueryParams } from '../../../../shared/lib/deep-links/routes/swap';
import { useBridgeNavigation } from '../../../hooks/bridge/useBridgeNavigation';
import { transitionForward } from '../../../components/ui/transition';

export function SwapAgainButton({
  destinationToken,
  sourceToken,
}: {
  destinationToken: TokenAmount | undefined;
  sourceToken: TokenAmount | undefined;
}) {
  const { navigateToBridgePage } = useBridgeNavigation();
  const searchParams = useMemo(() => {
    if (!sourceToken?.assetId || !destinationToken?.assetId) {
      return undefined;
    }

    const params = new URLSearchParams();
    const amount = getHumanReadableTokenAmount(sourceToken);

    params.set(BridgeQueryParams.From, sourceToken.assetId);
    params.set(BridgeQueryParams.To, destinationToken.assetId);

    if (amount) {
      params.set(BridgeQueryParams.Amount, amount);
    }

    return params.toString() ? params : undefined;
  }, [destinationToken, sourceToken]);

  const handleClick = useCallback(() => {
    if (!searchParams) {
      return;
    }

    transitionForward(() =>
      navigateToBridgePage({
        token: null,
        search: searchParams,
        isEntrypoint: true,
      }),
    );
  }, [navigateToBridgePage, searchParams]);

  if (!searchParams) {
    return null;
  }

  return (
    <Button
      className="w-full"
      size={ButtonSize.Lg}
      variant={ButtonVariant.Primary}
      onClick={handleClick}
    >
      Swap again
    </Button>
  );
}
