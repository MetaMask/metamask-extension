import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { type TransactionMeta } from '@metamask/transaction-controller';
import { type NetworkClientConfiguration } from '@metamask/network-controller';

import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  Text,
  ModalFooter,
} from '../../../component-library';
import {
  AlignItems,
  FlexDirection,
} from '../../../../helpers/constants/design-system';
import { I18nContext } from '../../../../contexts/i18n';

type TransactionAlreadyConfirmedModalProps = {
  hideModal: () => void;
  viewTransaction: (
    transaction: TransactionMeta,
    rpcPrefs: NetworkClientConfiguration,
  ) => void;
  transaction: TransactionMeta;
  rpcPrefs: NetworkClientConfiguration;
};

/*
 * This modal is displayed when user tries to submit a cancel transaction when the original transaction has been already confirmed
 */
export default function TransactionAlreadyConfirmed({
  hideModal,
  viewTransaction,
  transaction,
  rpcPrefs,
}: TransactionAlreadyConfirmedModalProps) {
  const t = useContext(I18nContext);
  return (
    <Modal isOpen onClose={hideModal}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader onClose={hideModal}>
          {t('yourTransactionConfirmed')}
        </ModalHeader>
        <ModalBody>
          <Text>{t('yourTransactionJustConfirmed')}</Text>
        </ModalBody>
        <ModalFooter
          onSubmit={hideModal}
          onCancel={() => viewTransaction(transaction, rpcPrefs)}
          submitButtonProps={{
            children: t('gotIt'),
          }}
          cancelButtonProps={{
            children: t('viewOnBlockExplorer'),
          }}
          containerProps={{
            flexDirection: FlexDirection.Column,
            alignItems: AlignItems.stretch,
          }}
        />
      </ModalContent>
    </Modal>
  );
}

TransactionAlreadyConfirmed.propTypes = {
  hideModal: PropTypes.func.isRequired,
  viewTransaction: PropTypes.func.isRequired,
  transaction: PropTypes.object.isRequired,
  rpcPrefs: PropTypes.object.isRequired,
};
