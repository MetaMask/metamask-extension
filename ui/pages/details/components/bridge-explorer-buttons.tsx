import React, { useState, useCallback } from 'react';
import {
  Button,
  ButtonSize,
  ButtonVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { NetworkName } from '../../../components/app/transaction/network-name';
import { useBlockExplorerUrl } from './shared';

type Props = {
  sourceChainId: string;
  sourceTxHash: string | undefined;
  destChainId: string | undefined;
  destTxHash: string | undefined;
};

export function BridgeExplorerButtons({
  sourceChainId,
  sourceTxHash,
  destChainId,
  destTxHash,
}: Props) {
  const t = useI18nContext();
  const [showPopup, setShowPopup] = useState(false);

  const sourceUrl = useBlockExplorerUrl(sourceChainId, sourceTxHash);
  const destUrl = useBlockExplorerUrl(destChainId ?? '', destTxHash);

  const handleSourceClick = useCallback(() => {
    if (sourceUrl) {
      global.platform.openTab({ url: sourceUrl });
    }
    setShowPopup(false);
  }, [sourceUrl]);

  const handleDestClick = useCallback(() => {
    if (destUrl) {
      global.platform.openTab({ url: destUrl });
    }
    setShowPopup(false);
  }, [destUrl]);

  if (!sourceUrl) {
    return null;
  }

  // Single chain or no dest URL — fall back to single button
  if (!destChainId || destChainId === sourceChainId || !destUrl) {
    return (
      <Button
        className="w-full"
        data-testid="transaction-details-block-explorer"
        size={ButtonSize.Lg}
        variant={ButtonVariant.Secondary}
        onClick={() => global.platform.openTab({ url: sourceUrl })}
      >
        {t('viewOnBlockExplorer')}
      </Button>
    );
  }

  return (
    <div className="relative">
      <Button
        className="w-full"
        data-testid="transaction-details-block-explorer"
        size={ButtonSize.Lg}
        variant={ButtonVariant.Secondary}
        onClick={() => setShowPopup(true)}
      >
        {t('viewOnBlockExplorer')}
      </Button>

      {showPopup && (
        <>
          <button
            className="fixed inset-0 z-10 cursor-default bg-transparent"
            aria-label="Close"
            onClick={() => setShowPopup(false)}
          />
          <div className="absolute bottom-full left-0 right-0 z-20 mb-2 rounded-lg border border-border-muted bg-background-default p-4 shadow-lg">
            <p className="text-body-sm mb-3 text-text-alternative">
              {t('bridgeExplorerPopupDescription')}
            </p>
            <div className="flex flex-col gap-2">
              <Button
                className="w-full justify-start gap-2"
                size={ButtonSize.Lg}
                variant={ButtonVariant.Secondary}
                onClick={handleSourceClick}
              >
                <NetworkName chainId={sourceChainId} />
              </Button>
              <Button
                className="w-full justify-start gap-2"
                size={ButtonSize.Lg}
                variant={ButtonVariant.Secondary}
                onClick={handleDestClick}
              >
                <NetworkName chainId={destChainId} />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
