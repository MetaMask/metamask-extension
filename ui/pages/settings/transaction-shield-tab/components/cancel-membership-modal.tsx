import React from 'react';
import { Subscription } from '@metamask/subscription-controller';
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

  return (
    <Modal
      isOpen
      onClose={onClose}
      className="cancel-membership-modal"
      data-testid="cancel-membership-modal"
    >
      <ModalOverlay />
      <ModalContent alignItems={AlignItems.flexStart}>
        <ModalHeader onClose={onClose}>{t('areYouSure')}</ModalHeader>
        <ModalBody>
          <Text variant={TextVariant.BodyMd}>
            {isPaused
              ? t('shieldTxCancelWhenPausedDetails')
              : t('shieldTxCancelDetails', [
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
                ])}
          </Text>
        </ModalBody>
        <ModalFooter
          onSubmit={onConfirm}
          submitButtonProps={{
            'data-testid': 'cancel-membership-modal-submit-button',
            children: t('shieldTxMembershipCancel'),
            danger: true,
          }}
        />
      </ModalContent>
    </Modal>
  );
}
