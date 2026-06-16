import React, { useCallback } from 'react';
import {
  Button,
  ButtonSize,
  ButtonVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getExplorerTxUrl, useBlockExplorerUrl } from './shared';

type Props = {
  chainId?: string;
  txHash: string | undefined;
  blockExplorerUrl?: string;
};

export function BlockExplorerButton({
  chainId,
  txHash,
  blockExplorerUrl,
}: Props) {
  const t = useI18nContext();
  const chainExplorerTxUrl = useBlockExplorerUrl(chainId ?? '', txHash);
  const explorerTxUrl = blockExplorerUrl
    ? getExplorerTxUrl({ chainId: '', txHash, blockExplorerUrl })
    : chainExplorerTxUrl;

  const handleClick = useCallback(() => {
    if (explorerTxUrl) {
      global.platform.openTab({ url: explorerTxUrl });
    }
  }, [explorerTxUrl]);

  if (!explorerTxUrl) {
    return null;
  }

  return (
    <Button
      className="w-full"
      data-explorer-url={explorerTxUrl}
      data-testid="transaction-details-block-explorer"
      size={ButtonSize.Lg}
      variant={ButtonVariant.Secondary}
      onClick={handleClick}
    >
      {t('viewOnBlockExplorer')}
    </Button>
  );
}
