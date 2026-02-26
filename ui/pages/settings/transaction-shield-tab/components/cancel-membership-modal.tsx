import React from 'react';
import { CANCEL_TYPES, Subscription } from '@metamask/subscription-controller';
import { FontWeight, Text, TextVariant } from '@metamask/design-system-react';
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
} from '../../../../components/component-library';
import { AlignItems } from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { getShortDateFormatterV2 } from '../../../asset/util';
import { getIsShieldSubscriptionPaused } from '../../../../../shared/lib/shield';
import { getIsSubscriptionCancelNotAllowed } from '../../../../../shared/modules/shield';

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function CancelMembershipModal({
  onConfirm,
  onClose,
  subscription,
}: {
  onConfirm: () => void;
  onClose: () => void;
  subscription: Subscription;
}) {
  const t = useI18nContext();
  const isPaused = getIsShieldSubscriptionPaused(subscription);
  const { cancelType } = subscription;

  const isCancelAllowed = !getIsSubscriptionCancelNotAllowed(cancelType);

  const getModalContent = () => {
    if (isPaused) {
      return t('shieldTxCancelWhenPausedDetails');
    }

    switch (cancelType) {
      case CANCEL_TYPES.NOT_ALLOWED:
        return t('shieldTxCancelNotAllowed');
      case CANCEL_TYPES.NOT_ALLOWED_PENDING_VERIFICATION:
        return t('shieldTxCancelNotAllowedPendingVerification');
      case CANCEL_TYPES.ALLOWED_IMMEDIATE:
        return t('shieldTxCancelImmediateDetails');
      case CANCEL_TYPES.ALLOWED_AT_PERIOD_END:
      default:
        return t('shieldTxCancelDetails', [
          <Text
            asChild
            key="cancel-date"
            variant={TextVariant.BodyMd}
            fontWeight={FontWeight.Medium}
          >
            <span>
              {getShortDateFormatterV2().format(
                new Date(subscription.currentPeriodEnd),
              )}
            </span>
          </Text>,
        ]);
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      className="cancel-membership-modal"
      data-testid="cancel-membership-modal"
    >
      <ModalOverlay />
      <ModalContent alignItems={AlignItems.flexStart}>
        <ModalHeader onClose={onClose}>
          {isCancelAllowed ? t('areYouSure') : t('actionUnavailable')}
        </ModalHeader>
        <ModalBody>
          <Text variant={TextVariant.BodyMd}>{getModalContent()}</Text>
        </ModalBody>
        {isCancelAllowed && (
          <ModalFooter
            onSubmit={onConfirm}
            submitButtonProps={{
              'data-testid': 'cancel-membership-modal-submit-button',
              children: t('shieldTxMembershipCancel'),
              danger: true,
            }}
          />
        )}
      </ModalContent>
    </Modal>
  );
}
