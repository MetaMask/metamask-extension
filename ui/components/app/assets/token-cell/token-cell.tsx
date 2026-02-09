import React, { useCallback, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Text,
  TextVariant,
  TextColor,
  FontWeight,
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
import {
  isEligibleForMerklRewards,
  MERKL_FEATURE_FLAG_KEY,
  SCROLL_TO_MERKL_REWARDS_KEY,
} from '../merkl-rewards';
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

  // When clicking specifically on the "Claim bonus" badge, set a flag so the
  // MerklRewards section on the asset page scrolls into view automatically.
  const handleBadgeClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      sessionStorage.setItem(SCROLL_TO_MERKL_REWARDS_KEY, 'true');
      onClick?.();
    },
    [onClick],
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
            <span onClick={handleBadgeClick} style={{ cursor: 'pointer' }}>
              <Text
                variant={TextVariant.BodySm}
                fontWeight={FontWeight.Medium}
                color={TextColor.PrimaryDefault}
                data-testid="claim-bonus-badge"
              >
                {t('merklRewardsClaimBonus')}
              </Text>
            </span>
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
