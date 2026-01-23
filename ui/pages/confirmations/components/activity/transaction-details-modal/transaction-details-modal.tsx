import React from 'react';
import { TransactionMeta } from '@metamask/transaction-controller';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  Text,
} from '../../../../../components/component-library';
import {
  Display,
  FlexDirection,
  TextAlign,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { TransactionDetailsProvider } from '../transaction-details-context';
import { TransactionDetails } from '../transaction-details';

export type TransactionDetailsModalProps = {
  transactionMeta: TransactionMeta;
  onClose: () => void;
};

// eslint-disable-next-line @typescript-eslint/naming-convention
export function TransactionDetailsModal({
  transactionMeta,
  onClose,
}: TransactionDetailsModalProps) {
  const t = useI18nContext();

  return (
    <Modal
      onClose={onClose}
      data-testid="transaction-details-modal"
      isOpen
      isClosedOnOutsideClick
      isClosedOnEscapeKey
    >
      <ModalOverlay />
      <ModalContent
        modalDialogProps={{
          display: Display.Flex,
          flexDirection: FlexDirection.Column,
          padding: 4,
        }}
      >
        <ModalHeader onClose={onClose} padding={0}>
          <Text variant={TextVariant.headingMd} textAlign={TextAlign.Center}>
            {t('perpsDepositTitle')}
          </Text>
        </ModalHeader>

        <TransactionDetailsProvider transactionMeta={transactionMeta}>
          <TransactionDetails />
        </TransactionDetailsProvider>
      </ModalContent>
    </Modal>
  );
}
