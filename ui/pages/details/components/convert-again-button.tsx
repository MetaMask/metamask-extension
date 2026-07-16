import React, { useCallback } from 'react';
import type { Hex } from '@metamask/utils';
import {
  Button,
  ButtonSize,
  ButtonVariant,
} from '@metamask/design-system-react';
import type { TokenAmount } from '../../../../shared/lib/activity/types';
import { convertCaipToHexChainId } from '../../../../shared/lib/network.utils';
import { useMusdConversion } from '../../../hooks/musd';
import { useBoolean } from '../../../hooks/useBoolean';
import { useI18nContext } from '../../../hooks/useI18nContext';

function parseAssetId(
  assetId: string,
): { address: string; chainId: Hex } | null {
  // assetId format: "eip155:1/erc20:0xAddress"
  const [caipChainId, assetRef] = assetId.split('/');
  if (!caipChainId || !assetRef) {
    return null;
  }
  const address = assetRef.split(':')[1];
  if (!address) {
    return null;
  }
  try {
    const chainId = convertCaipToHexChainId(
      caipChainId as `${string}:${string}`,
    );
    return { address, chainId: chainId as Hex };
  } catch {
    return null;
  }
}

export function ConvertAgainButton({
  sourceToken,
}: {
  sourceToken: TokenAmount | undefined;
}) {
  const t = useI18nContext();
  const { startConversionFlow } = useMusdConversion();
  const {
    value: isLoading,
    setTrue: setLoading,
    setFalse: setNotLoading,
  } = useBoolean();

  const preferredToken = sourceToken?.assetId
    ? parseAssetId(sourceToken.assetId)
    : null;

  const handleClick = useCallback(async () => {
    if (!preferredToken || isLoading) {
      return;
    }
    setLoading();
    try {
      await startConversionFlow({ preferredToken, skipEducation: true });
    } finally {
      setNotLoading();
    }
  }, [preferredToken, isLoading, startConversionFlow]);

  if (!preferredToken) {
    return null;
  }

  return (
    <Button
      className="w-full"
      size={ButtonSize.Lg}
      variant={ButtonVariant.Primary}
      onClick={handleClick}
      disabled={isLoading}
    >
      {t('convertAgain')}
    </Button>
  );
}
