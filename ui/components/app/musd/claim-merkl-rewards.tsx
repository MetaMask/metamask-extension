import React, { useCallback, useState } from 'react';
import type { Hex } from '@metamask/utils';
import {
  Box,
  Button,
  ButtonSize,
  ButtonVariant,
  Text,
  TextVariant,
  TextColor,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useMerklClaim } from './hooks/useMerklClaim';
import { usePendingMerklClaim } from './hooks/usePendingMerklClaim';
import MerklClaimModal from './merkl-claim-modal';

type ClaimMerklRewardsProps = {
  tokenAddress: string;
  chainId: Hex;
};

/**
 * Renders the Claim button for Merkl rewards and a confirmation modal
 * explaining that bonuses are claimed on Linea. On "Continue", builds
 * the claim transaction and routes the user to the confirmation page.
 *
 * @param props - Component props
 * @param props.tokenAddress - The token's contract address
 * @param props.chainId - The chain ID of the token
 */
const ClaimMerklRewards: React.FC<ClaimMerklRewardsProps> = ({
  tokenAddress,
  chainId,
}) => {
  const t = useI18nContext();
  const [showModal, setShowModal] = useState(false);

  const {
    isClaiming,
    error: claimError,
    claimRewards,
  } = useMerklClaim({
    tokenAddress,
    chainId,
  });
  const { hasPendingClaim } = usePendingMerklClaim();

  // Show loading if currently claiming OR if there's an in-flight claim transaction
  const isLoading = isClaiming || hasPendingClaim;

  const handleClaimPress = useCallback(() => {
    setShowModal(true);
  }, []);

  const handleModalClose = useCallback(() => {
    setShowModal(false);
  }, []);

  return (
    <>
      <Box paddingLeft={4} paddingRight={4} paddingBottom={4}>
        <Button
          data-testid="claim-merkl-rewards-button"
          variant={ButtonVariant.Secondary}
          size={ButtonSize.Lg}
          isFullWidth
          onClick={handleClaimPress}
          isDisabled={isLoading}
          isLoading={isLoading}
        >
          {t('merklRewardsClaim')}
        </Button>
        {claimError && (
          <Text
            variant={TextVariant.BodySm}
            color={TextColor.ErrorDefault}
            className="mt-2"
            data-testid="claim-merkl-rewards-error"
          >
            {t('merklRewardsUnexpectedError')}
          </Text>
        )}
      </Box>

      <MerklClaimModal
        claimRewards={claimRewards}
        isOpen={showModal}
        onClose={handleModalClose}
      />
    </>
  );
};

export default ClaimMerklRewards;
