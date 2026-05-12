import React, { useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  ModalContentSize,
} from '../../../component-library';
import { ThemeType } from '../../../../../shared/constants/preferences';
import {
  AlignItems,
  JustifyContent,
} from '../../../../helpers/constants/design-system';
import {
  selectRewardsModalOpen,
  selectCandidateSubscriptionId,
} from '../../../../ducks/rewards/selectors';
import { getHardwareWalletType } from '../../../../../shared/lib/selectors/keyring';
import {
  setRewardsModalOpen,
  setOnboardingReferralCode,
  setRewardsDeeplinkUrl,
} from '../../../../ducks/rewards';
import { useTheme } from '../../../../hooks/useTheme';
import RewardsErrorToast from '../RewardsErrorToast';
import RewardsQRCode from '../RewardsQRCode';
import { useAppSelector } from '../../../../store/store';
import { HardwareKeyringType } from '../../../../../shared/constants/hardware-wallets';
import OnboardingMainStep from './OnboardingMainStep';

type RewardsModalProps = {
  onClose?: () => void;

  /**
   * The number of reward points which user will receive after linking the reward to the shield subscription.
   */
  rewardPoints?: number;

  /**
   * The shield subscription ID to link the reward to.
   */
  shieldSubscriptionId?: string;
};

// eslint-disable-next-line @typescript-eslint/naming-convention
export default function RewardsModal({
  onClose,
  rewardPoints,
  shieldSubscriptionId,
}: Readonly<RewardsModalProps>) {
  const isOpen = useSelector(selectRewardsModalOpen);
  const candidateSubscriptionId = useSelector(selectCandidateSubscriptionId);
  const rewardActiveAccountSubscriptionId = useAppSelector(
    (state) => state.metamask.rewardsActiveAccount?.subscriptionId,
  );
  const hardwareWalletType = useSelector(getHardwareWalletType);
  const dispatch = useDispatch();

  const theme = useTheme();

  const isValidCandidateSubscriptionId = useMemo(
    () =>
      candidateSubscriptionId &&
      candidateSubscriptionId !== 'error' &&
      candidateSubscriptionId !==
        'error-existing-subscription-hardware-wallet-explicit-sign' &&
      candidateSubscriptionId !== 'pending' &&
      candidateSubscriptionId !== 'retry',
    [candidateSubscriptionId],
  );

  const isOptedIn =
    Boolean(rewardActiveAccountSubscriptionId) ||
    Boolean(isValidCandidateSubscriptionId);

  const handleClose = useCallback(() => {
    dispatch(setRewardsModalOpen(false));
    dispatch(setOnboardingReferralCode(null));
    dispatch(setRewardsDeeplinkUrl(null));
    onClose?.();
  }, [dispatch, onClose]);

  return (
    <Modal
      data-testid="rewards-modal"
      isOpen={isOpen}
      onClose={handleClose}
      // qr code hadware wallet uses a popover signing modal, so we don't want to close the rewards modal when clicking to sign a message
      isClosedOnOutsideClick={hardwareWalletType !== HardwareKeyringType.qr}
    >
      <ModalOverlay className="rewards-onboarding-modal__overlay" />
      <ModalContent
        className="rewards-onboarding-modal__content"
        alignItems={AlignItems.center}
        justifyContent={JustifyContent.center}
        size={ModalContentSize.Md}
        modalDialogProps={{
          paddingTop: 0,
          paddingBottom: 0,
          style: {
            height: 'auto',
            minHeight: isOptedIn ? undefined : '600px',
            alignItems: 'center',
            justifyContent: 'center',
          },
        }}
      >
        <ModalHeader
          data-theme={theme === 'light' ? ThemeType.light : ThemeType.dark}
          data-testid="rewards-modal-header"
          closeButtonProps={{
            className: 'absolute z-10',
            style: {
              top: '24px',
              right: '12px',
            },
          }}
          paddingBottom={0}
          onClose={handleClose}
        />

        {isOptedIn ? (
          <RewardsQRCode />
        ) : (
          <OnboardingMainStep
            rewardPoints={rewardPoints}
            shieldSubscriptionId={shieldSubscriptionId}
          />
        )}
        <RewardsErrorToast />
      </ModalContent>
    </Modal>
  );
}
