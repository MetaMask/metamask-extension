import React from 'react';
import { Subscription } from '@metamask/subscription-controller';
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
} from '../../../components/component-library';
import {
  AlignItems,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getShortDateFormatterV2 } from '../../asset/util';

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
          <Text variant={TextVariant.bodyMd}>
            {t('shieldTxCancelDetails', [
              <Text
                key="cancel-date"
                variant={TextVariant.bodyMdMedium}
                as="span"
              >
                {getShortDateFormatterV2().format(
                  new Date(subscription.currentPeriodEnd),
                )}
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
