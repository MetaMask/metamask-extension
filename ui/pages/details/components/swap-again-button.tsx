import React, { useCallback, useMemo } from 'react';
import {
  Button,
  ButtonSize,
  ButtonVariant,
} from '@metamask/design-system-react';
import {
  FeatureId,
  UnifiedSwapBridgeEventName,
} from '@metamask/bridge-controller';
import { useDispatch } from 'react-redux';
import type { TokenAmount } from '../../../../shared/lib/activity/types';
import { MetaMetricsSwapsEventSource } from '../../../../shared/constants/metametrics';
import { BridgeQueryParams } from '../../../../shared/lib/deep-links/routes/swap';
import { trackUnifiedSwapBridgeEvent } from '../../../ducks/bridge/actions';
import { useBridgeNavigation } from '../../../hooks/bridge/useBridgeNavigation';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { transitionForward } from '../../../components/ui/transition';

export function SwapAgainButton({
  destinationToken,
  sourceToken,
}: {
  destinationToken: TokenAmount | undefined;
  sourceToken: TokenAmount | undefined;
}) {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const { navigateToBridgePage } = useBridgeNavigation();

  const buttonLabelKey = useMemo(() => {
    if (!sourceToken?.assetId || !destinationToken?.assetId) {
      return 'swapAgain';
    }

    const sourceChainId = sourceToken.assetId.split('/')[0];
    const destinationChainId = destinationToken.assetId.split('/')[0];

    return sourceChainId === destinationChainId ? 'swapAgain' : 'bridgeAgain';
  }, [destinationToken?.assetId, sourceToken?.assetId]);

  const searchParams = useMemo(() => {
    if (!sourceToken?.assetId || !destinationToken?.assetId) {
      return undefined;
    }

    const params = new URLSearchParams();
    params.set(BridgeQueryParams.From, sourceToken.assetId);
    params.set(BridgeQueryParams.To, destinationToken.assetId);

    return params;
  }, [destinationToken?.assetId, sourceToken?.assetId]);

  const handleClick = useCallback(() => {
    if (!searchParams) {
      return;
    }

    dispatch(
      trackUnifiedSwapBridgeEvent(UnifiedSwapBridgeEventName.ButtonClicked, {
        location: MetaMetricsSwapsEventSource.ActivityDetails as never,
        /* eslint-disable @typescript-eslint/naming-convention */
        token_symbol_source: sourceToken?.symbol ?? 'ETH',
        token_symbol_destination: destinationToken?.symbol ?? '',
        feature_id: FeatureId.UNIFIED_SWAP_BRIDGE,
        /* eslint-enable @typescript-eslint/naming-convention */
      }),
    );

    transitionForward(() => {
      navigateToBridgePage({
        token: null,
        search: searchParams,
        isEntrypoint: true,
      });
    });
  }, [
    dispatch,
    navigateToBridgePage,
    searchParams,
    sourceToken?.symbol,
    destinationToken?.symbol,
  ]);

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
      {t(buttonLabelKey)}
    </Button>
  );
}
