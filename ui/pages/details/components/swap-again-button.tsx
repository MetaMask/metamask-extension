import React, { useCallback, useMemo } from 'react';
import {
  Button,
  ButtonSize,
  ButtonVariant,
} from '@metamask/design-system-react';
import { formatAddressToCaipReference } from '@metamask/bridge-controller';
import { parseCaipAssetType, type CaipAssetType } from '@metamask/utils';
import type { TokenAmount } from '../../../../shared/lib/activity/types';
import { MetaMetricsSwapsEventSource } from '../../../../shared/constants/metametrics';
import useBridging from '../../../hooks/bridge/useBridging';
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
  const { openBridgeExperience } = useBridging();
  const buttonLabelKey = useMemo(() => {
    if (!sourceToken?.assetId || !destinationToken?.assetId) {
      return 'swapAgain';
    }

    const sourceChainId = sourceToken.assetId.split('/')[0];
    const destinationChainId = destinationToken.assetId.split('/')[0];

    return sourceChainId === destinationChainId ? 'swapAgain' : 'bridgeAgain';
  }, [destinationToken?.assetId, sourceToken?.assetId]);

  const canSwapAgain =
    sourceToken?.assetId && destinationToken?.assetId && sourceToken.symbol;

  const handleClick = useCallback(() => {
    const sourceAssetId = sourceToken?.assetId as CaipAssetType;
    const sourceSymbol = sourceToken?.symbol;
    const destinationAssetId = destinationToken?.assetId;

    if (!sourceAssetId || !sourceSymbol || !destinationAssetId) {
      return;
    }

    transitionForward(() =>
      openBridgeExperience(
        MetaMetricsSwapsEventSource.ActivityDetails,
        {
          symbol: sourceSymbol,
          address: formatAddressToCaipReference(sourceAssetId),
          chainId: parseCaipAssetType(sourceAssetId).chainId,
          decimals: sourceToken?.decimals,
        },
        destinationAssetId,
      ),
    );
  }, [destinationToken?.assetId, openBridgeExperience, sourceToken]);

  if (!canSwapAgain) {
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
