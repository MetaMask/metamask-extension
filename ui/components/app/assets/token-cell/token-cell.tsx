import React, { useCallback, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import type { Hex } from '@metamask/utils';
import {
  Text,
  TextVariant,
  TextColor,
  FontWeight,
  Icon,
  IconName,
  IconSize,
  IconColor,
} from '@metamask/design-system-react';
import { useTokenDisplayInfo } from '../hooks';
import {
  ButtonSecondary,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
} from '../../../component-library';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  getSafeNativeCurrencySymbol,
  type SafeChain,
} from '../../../../pages/settings/networks-tab/networks-form/use-safe-chains';
import { NETWORKS_ROUTE } from '../../../../helpers/constants/routes';
import { setEditedNetwork } from '../../../../store/actions';
import { getRemoteFeatureFlags } from '../../../../selectors/remote-feature-flags';
import { type TokenWithFiatAmount } from '../types';
import GenericAssetCellLayout from '../asset-list/cells/generic-asset-cell-layout';
import { AssetCellBadge } from '../asset-list/cells/asset-cell-badge';
import { isEvmChainId } from '../../../../../shared/lib/asset-utils';
import { isEligibleForMerklRewards } from '../../musd';
import { useMerklClaim } from '../../musd/hooks/useMerklClaim';
import { MERKL_FEATURE_FLAG_KEY } from '../../musd/constants';
import {
  TokenCellTitle,
  TokenCellPercentChange,
  TokenCellPrimaryDisplay,
  TokenCellSecondaryDisplay,
} from './cells';

export type TokenCellProps = {
  token: TokenWithFiatAmount;
  privacyMode?: boolean;
  onClick?: () => void;
  fixCurrencyToUSD?: boolean;
  safeChains?: SafeChain[];
  /** When true, hides the Merkl "Claim bonus" badge (e.g. on asset detail page). */
  hideMerklBadge?: boolean;
};

// eslint-disable-next-line @typescript-eslint/naming-convention
function ClaimBonusBadge({
  isClaiming,
  onClick,
  label,
}: {
  isClaiming: boolean;
  onClick: (e: React.MouseEvent) => void;
  label: string;
}) {
  if (isClaiming) {
    return (
      <Icon
        name={IconName.Loading}
        size={IconSize.Sm}
        color={IconColor.PrimaryDefault}
        style={{ animation: 'spin 1.2s linear infinite' }}
        data-testid="claim-bonus-spinner"
      />
    );
  }

  return (
    <span onClick={onClick} style={{ cursor: 'pointer' }}>
      <Text
        variant={TextVariant.BodySm}
        fontWeight={FontWeight.Medium}
        color={TextColor.PrimaryDefault}
        data-testid="claim-bonus-badge"
      >
        {label}
      </Text>
    </span>
  );
}

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function TokenCell({
  token,
  privacyMode = false,
  onClick,
  fixCurrencyToUSD = false,
  safeChains,
  hideMerklBadge = false,
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

  const remoteFeatureFlags = useSelector(getRemoteFeatureFlags);
  const showClaimBonusBadge = useMemo(
    () =>
      !hideMerklBadge &&
      Boolean(remoteFeatureFlags?.[MERKL_FEATURE_FLAG_KEY]) &&
      isEligibleForMerklRewards(token.chainId, token.address),
    [hideMerklBadge, remoteFeatureFlags, token.chainId, token.address],
  );

  const { claimRewards, isClaiming } = useMerklClaim({
    tokenAddress: token.address as string,
    chainId: token.chainId as Hex,
  });

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

  // Trigger the claim transaction directly, routing to the confirmation page.
  const handleBadgeClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      claimRewards().catch(() => {
        // Error state is managed by useMerklClaim
      });
    },
    [claimRewards],
  );

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
        footerLeftDisplay={
          showClaimBonusBadge ? (
            <ClaimBonusBadge
              isClaiming={isClaiming}
              onClick={handleBadgeClick}
              label={t('merklRewardsClaimBonus')}
            />
          ) : (
            <TokenCellPercentChange token={displayToken} />
          )
        }
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
