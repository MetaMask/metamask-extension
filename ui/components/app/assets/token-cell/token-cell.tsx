import type { Hex } from '@metamask/utils';
import React, { useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { isEvmChainId } from '../../../../../shared/lib/asset-utils';
import { NETWORKS_ROUTE } from '../../../../helpers/constants/routes';
import { useMusdBalance, useMusdCtaVisibility } from '../../../../hooks/musd';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  getSafeNativeCurrencySymbol,
  type SafeChain,
} from '../../../../pages/settings/networks-tab/networks-form/use-safe-chains';
import { setEditedNetwork } from '../../../../store/actions';
import {
  ButtonSecondary,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
} from '../../../component-library';
import { ClaimBonusBadge, MusdConvertLink, useMerklRewards } from '../../musd';
import { getBonusAmountRange } from '../../musd/merkl-bonus-analytics';
import type {
  MerklClaimBonusAnalyticsLocation,
  MusdConvertLinkEntryPoint,
} from '../../musd/musd-events';
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

export type TokenCellMusdOptions = {
  /** When set, enables Merkl fetch/badge for this cell. */
  merklClaimBonus?: { location: MerklClaimBonusAnalyticsLocation };
  /** When set, enables footer convert link (subject to `useMusdCtaVisibility` / balance rules). */
  convert?: { entryPoint: MusdConvertLinkEntryPoint };
};

export type TokenCellProps = {
  token: TokenWithFiatAmount;
  privacyMode?: boolean;
  onClick?: () => void;
  fixCurrencyToUSD?: boolean;
  safeChains?: SafeChain[];
  /** Merkl claim bonus and/or mUSD convert surfaces; parent must pass explicit analytics locations. */
  musd?: TokenCellMusdOptions;
};

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function TokenCell({
  token,
  privacyMode = false,
  onClick,
  fixCurrencyToUSD = false,
  safeChains,
  musd,
}: TokenCellProps) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const t = useI18nContext();
  const isEvm = isEvmChainId(token.chainId);
  const nativeCurrencySymbol = useMemo(
    () => getSafeNativeCurrencySymbol(safeChains, token.chainId),
    [safeChains, token.chainId],
  );
  const [showScamWarningModal, setShowScamWarningModal] = useState(false);

  const showMerklBadge = Boolean(musd?.merklClaimBonus);

  // Check whether there are rewards available for the user
  const {
    hasClaimableReward,
    isEligible,
    hasClaimedBefore,
    claimableRewardDisplay,
    refetch: refetchMerklRewards,
  } = useMerklRewards({
    tokenAddress: token.address,
    chainId: token.chainId as Hex,
    showMerklBadge,
  });

  const { shouldShowTokenListItemCta } = useMusdCtaVisibility();
  const { hasMusdBalance } = useMusdBalance();

  const showMusdCta = useMemo(() => {
    if (!musd?.convert || !token.address || !token.chainId) {
      return false;
    }
    return shouldShowTokenListItemCta(
      {
        address: token.address as Hex,
        chainId: token.chainId as Hex,
        symbol: token.symbol,
      },
      { hasMusdBalance },
    );
  }, [
    musd?.convert,
    token.address,
    token.chainId,
    token.symbol,
    shouldShowTokenListItemCta,
    hasMusdBalance,
  ]);

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

  const merklBonusAmountRange = useMemo(
    () => getBonusAmountRange(claimableRewardDisplay ?? '< 0.01'),
    [claimableRewardDisplay],
  );

  const handleScamWarningModal = (arg: boolean) => {
    setShowScamWarningModal(arg);
  };

  const renderFooterLeft = () => {
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
    if (musd?.merklClaimBonus && isEligible && hasClaimableReward) {
      return (
        <ClaimBonusBadge
          tokenAddress={token.address as string}
          chainId={token.chainId as Hex}
          label={t('merklRewardsClaimBonus')}
          refetchRewards={refetchMerklRewards}
          analyticsLocation={musd.merklClaimBonus.location}
          assetSymbol={token.symbol}
          bonusAmountRange={merklBonusAmountRange}
          hasClaimedBefore={hasClaimedBefore}
        />
      );
    }
    return <TokenCellPercentChange token={displayToken} />;
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
        <Modal isOpen onClose={() => setShowScamWarningModal(false)}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader onClose={() => setShowScamWarningModal(false)}>
              {t('nativeTokenScamWarningTitle')}
            </ModalHeader>
            <ModalBody marginTop={4} marginBottom={4}>
              {t('nativeTokenScamWarningDescription', [
                token.symbol,
                nativeCurrencySymbol ||
                  t('nativeTokenScamWarningDescriptionExpectedTokenFallback'),
              ])}
            </ModalBody>
            <ModalFooter>
              <ButtonSecondary
                onClick={() => {
                  dispatch(setEditedNetwork({ chainId: token.chainId }));
                  navigate(NETWORKS_ROUTE);
                }}
                block
              >
                {t('nativeTokenScamWarningConversion')}
              </ButtonSecondary>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
    </>
  );
}
