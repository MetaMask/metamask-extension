import type { Hex } from '@metamask/utils';
import React, { useMemo, useState } from 'react';
import { isEvmChainId } from '../../../../../shared/lib/asset-utils';
import { useMusdCtaVisibility } from '../../../../hooks/musd';
import { type SafeChain } from '../../../multichain/networks-form/use-safe-chains';
import { MusdConvertLink } from '../../musd';
import { MoneyTokenListCta } from '../../money/money-token-list-cta';
import type { MoneyTokenListCta as MoneyTokenListCtaConfig } from '../../../../hooks/money/useMoneyTokenListCta';
import type { MusdConvertLinkEntryPoint } from '../../musd/musd-events';
import { AssetCellBadge } from '../asset-list/cells/asset-cell-badge';
import GenericAssetCellLayout from '../asset-list/cells/generic-asset-cell-layout';
import { useTokenDisplayInfo } from '../hooks';
import { type TokenWithFiatAmount } from '../types';

import {
  TokenCellPercentChange,
  TokenCellPrimaryDisplay,
  TokenCellSecondaryDisplay,
  TokenCellTitle,
} from './cells';
import { NativeTokenScamWarningModal } from './native-token-scam-warning-modal';

export type TokenCellMusdOptions = {
  /** When set, enables footer convert link (subject to `useMusdCtaVisibility` / balance rules). */
  convert?: { entryPoint: MusdConvertLinkEntryPoint };
};

export type TokenCellProps = {
  token: TokenWithFiatAmount;
  privacyMode?: boolean;
  onClick?: () => void;
  fixCurrencyToUSD?: boolean;
  safeChains?: SafeChain[];
  /** mUSD convert surface; parent must pass an explicit analytics entry point. */
  musd?: TokenCellMusdOptions;
  /** Money deposit CTA; takes priority over the mUSD convert link. */
  moneyCta?: MoneyTokenListCtaConfig;
  /** Replaces the price change, after any CTA. */
  priceChangeOverride?: React.ReactNode;
};

export default function TokenCell({
  token,
  privacyMode = false,
  onClick,
  fixCurrencyToUSD = false,
  safeChains,
  musd,
  moneyCta,
  priceChangeOverride,
}: TokenCellProps) {
  const isEvm = isEvmChainId(token.chainId);
  const [showScamWarningModal, setShowScamWarningModal] = useState(false);

  const { shouldShowTokenListItemCta } = useMusdCtaVisibility();

  const showMusdCta = useMemo(() => {
    if (!musd?.convert || !token.address || !token.chainId) {
      return false;
    }
    return shouldShowTokenListItemCta({
      address: token.address as Hex,
      chainId: token.chainId as Hex,
      symbol: token.symbol,
    });
  }, [
    musd?.convert,
    token.address,
    token.chainId,
    token.symbol,
    shouldShowTokenListItemCta,
  ]);

  const showMoneyCta = useMemo(
    () => Boolean(moneyCta?.shouldShow(token)),
    [moneyCta, token],
  );

  const tokenDisplayInfo = useTokenDisplayInfo({
    token,
    fixCurrencyToUSD,
  });

  const displayToken = useMemo(
    () => ({
      ...token,
      ...tokenDisplayInfo,
    }),
    [token, tokenDisplayInfo],
  );

  const handleScamWarningModal = (arg: boolean) => {
    setShowScamWarningModal(arg);
  };

  const renderFooterLeft = () => {
    if (showMoneyCta && moneyCta) {
      return <MoneyTokenListCta cta={moneyCta} token={token} />;
    }
    if (showMusdCta && musd?.convert) {
      return (
        <MusdConvertLink
          tokenAddress={token.address as Hex}
          chainId={token.chainId as Hex}
          tokenSymbol={token.symbol}
          entryPoint={musd.convert.entryPoint}
        />
      );
    }
    return (
      priceChangeOverride ?? <TokenCellPercentChange token={displayToken} />
    );
  };

  if (!token.chainId) {
    return null;
  }

  return (
    <>
      <GenericAssetCellLayout
        onClick={showScamWarningModal ? undefined : onClick}
        badge={
          <AssetCellBadge
            chainId={token.chainId}
            isNative={token.isNative}
            tokenImage={displayToken.tokenImage}
            symbol={token.symbol}
            assetId={token.assetId}
          />
        }
        headerLeftDisplay={<TokenCellTitle token={displayToken} />}
        headerRightDisplay={
          <TokenCellSecondaryDisplay
            token={displayToken}
            handleScamWarningModal={handleScamWarningModal}
            privacyMode={privacyMode}
          />
        }
        footerLeftDisplay={renderFooterLeft()}
        footerRightDisplay={
          <TokenCellPrimaryDisplay
            token={displayToken}
            privacyMode={privacyMode}
          />
        }
      />
      {isEvm && showScamWarningModal && (
        <NativeTokenScamWarningModal
          token={token}
          safeChains={safeChains}
          onClose={() => setShowScamWarningModal(false)}
        />
      )}
    </>
  );
}
