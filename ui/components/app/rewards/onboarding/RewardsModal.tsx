import React, { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
  Modal,
  ModalContent,
  ModalContentSize,
  ModalHeader,
  ModalOverlay,
} from '@metamask/design-system-react';
import { ThemeType } from '../../../../../shared/constants/preferences';
import {
  selectRewardsModalOpen,
  selectCandidateSubscriptionId,
} from '../../../../ducks/rewards/selectors';
import { getHardwareWalletType } from '../../../../../shared/lib/selectors/keyring';
import {
  setRewardsModalOpen,
  setRewardsDeeplinkUrl,
} from '../../../../ducks/rewards';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { useTheme } from '../../../../hooks/useTheme';
import RewardsErrorToast from '../RewardsErrorToast';
import RewardsQRCode from '../RewardsQRCode';
import { useAppSelector, useDispatch } from '../../../../store/hooks';
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
  const t = useI18nContext();

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
    dispatch(setRewardsDeeplinkUrl(null));
    onClose?.();
  }, [dispatch, onClose]);

  return (
    <Modal
      data-testid="parent-selector-rewards-page"
      isOpen={isOpen}
      onClose={handleClose}
      // qr code hadware wallet uses a popover signing modal, so we don't want to close the rewards modal when clicking to sign a message
      isClosedOnOutsideClick={hardwareWalletType !== HardwareKeyringType.qr}
    >
      <ModalOverlay className="rewards-onboarding-modal__overlay z-[1000]" />
      <ModalContent
        className="rewards-onboarding-modal__content z-[1000]"
        size={ModalContentSize.Md}
        modalDialogProps={{
          className: isOptedIn ? undefined : 'min-h-[600px]',
        }}
      >
        <ModalHeader
          data-theme={theme === 'light' ? ThemeType.light : ThemeType.dark}
          data-testid="rewards-modal-header"
          onClose={handleClose}
          closeButtonProps={{
            ariaLabel: t('close'),
          }}
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
