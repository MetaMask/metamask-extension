import React, { useCallback, useState } from 'react';
import type { Hex } from '@metamask/utils';
import {
  Box,
  BoxFlexDirection,
  BoxAlignItems,
  Button,
  ButtonSize,
  ButtonVariant,
  Text,
  TextVariant,
  TextColor,
  TextAlign,
} from '@metamask/design-system-react';
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
} from '../../../component-library';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { useMerklClaim } from './hooks/useMerklClaim';
import { usePendingMerklClaim } from './hooks/usePendingMerklClaim';
import { MUSD_BONUS_TERMS_URL } from './constants';

const MUSD_ICON_SRC = './images/musd-icon-no-background-2x.png';

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
    claimRewards,
    isClaiming,
    error: claimError,
  } = useMerklClaim({ tokenAddress, chainId });
  const { hasPendingClaim } = usePendingMerklClaim();

  // Show loading if currently claiming OR if there's an in-flight claim transaction
  const isLoading = isClaiming || hasPendingClaim;

  const handleClaimPress = useCallback(() => {
    setShowModal(true);
  }, []);

  const handleModalClose = useCallback(() => {
    setShowModal(false);
  }, []);

  const handleContinueClaim = useCallback(async () => {
    setShowModal(false);
    try {
      await claimRewards();
    } catch {
      // Error is handled by useMerklClaim hook and displayed via claimError
    }
  }, [claimRewards]);

  const handleTermsClick = useCallback(() => {
    global.platform.openTab({ url: MUSD_BONUS_TERMS_URL });
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

      {showModal && (
        <Modal
          isOpen
          onClose={handleModalClose}
          data-testid="claim-on-linea-modal"
        >
          <ModalOverlay />
          <ModalContent style={{ alignItems: 'center' }}>
            <ModalHeader onClose={handleModalClose}>
              {t('merklRewardsClaimOnLineaTitle')}
            </ModalHeader>
            <ModalBody>
              <Box
                flexDirection={BoxFlexDirection.Column}
                alignItems={BoxAlignItems.Center}
                gap={4}
              >
                <img
                  src={MUSD_ICON_SRC}
                  alt="mUSD"
                  width={120}
                  height={120}
                  data-testid="claim-on-linea-musd-image"
                />
                <Text variant={TextVariant.BodySm} textAlign={TextAlign.Center}>
                  {t('merklRewardsClaimOnLineaDescription')}{' '}
                  <Text
                    asChild
                    variant={TextVariant.BodySm}
                    color={TextColor.PrimaryDefault}
                  >
                    <span
                      className="merkl-rewards__terms-link cursor-pointer"
                      onClick={handleTermsClick}
                      role="link"
                      tabIndex={0}
                      data-testid="claim-on-linea-terms-link"
                    >
                      {t('merklRewardsTermsApply')}
                    </span>
                  </Text>
                </Text>
              </Box>
            </ModalBody>
            <ModalFooter>
              <Button
                variant={ButtonVariant.Primary}
                size={ButtonSize.Lg}
                isFullWidth
                onClick={handleContinueClaim}
                data-testid="claim-on-linea-continue-button"
              >
                {t('merklRewardsContinue')}
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
    </>
  );
};

export default ClaimMerklRewards;
