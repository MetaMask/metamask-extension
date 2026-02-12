import React, { useCallback } from 'react';
import {
  Box,
  BoxFlexDirection,
  BoxAlignItems,
  Button,
  ButtonSize,
  ButtonVariant,
  Text,
  TextButton,
  TextButtonSize,
  TextVariant,
  TextAlign,
} from '@metamask/design-system-react';
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
} from '../../component-library';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { MUSD_BONUS_TERMS_URL } from './constants';

const MUSD_ICON_SRC = './images/musd-icon-no-background-2x.png';

type MerklClaimModalProps = {
  isOpen: boolean;
  onClose: () => void;
  claimRewards: () => Promise<void>;
};

/**
 * Modal explaining that mUSD bonuses are claimed on Linea.
 * On "Continue", builds the claim transaction and routes to the confirmation page.
 *
 * @param props - Component props
 * @param props.isOpen - Whether the modal is open
 * @param props.onClose - Callback when the modal is closed
 * @param props.claimRewards - Triggers the process of claiming reward
 */
const MerklClaimModal: React.FC<MerklClaimModalProps> = ({
  isOpen,
  onClose,
  claimRewards,
}) => {
  const t = useI18nContext();

  const handleContinueClaim = useCallback(async () => {
    onClose();
    try {
      await claimRewards();
    } catch {
      // Error is handled by useMerklClaim hook
    }
  }, [claimRewards, onClose]);

  const handleTermsClick = useCallback(() => {
    global.platform.openTab({ url: MUSD_BONUS_TERMS_URL });
  }, []);

  if (!isOpen) {
    return null;
  }

  return (
    <Modal isOpen onClose={onClose} data-testid="claim-on-linea-modal">
      <ModalOverlay />
      <ModalContent style={{ alignItems: 'center' }}>
        <ModalHeader onClose={onClose}>
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
              <TextButton
                size={TextButtonSize.BodySm}
                className="text-primary-default"
                onClick={handleTermsClick}
                data-testid="claim-on-linea-terms-link"
              >
                {t('merklRewardsTermsApply')}
              </TextButton>
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
  );
};

export default MerklClaimModal;
