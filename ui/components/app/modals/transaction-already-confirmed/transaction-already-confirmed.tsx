import { getBlockExplorerLink } from '@metamask/etherscan-link';
import { type TransactionMeta } from '@metamask/transaction-controller';
import React, { useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { I18nContext } from '../../../../contexts/i18n';
import {
  AlignItems,
  FlexDirection,
} from '../../../../helpers/constants/design-system';
import { useModalProps } from '../../../../hooks/useModalProps';
import {
  getRpcPrefsForCurrentProvider,
  getTransaction,
} from '../../../../selectors';
import type { MetaMaskReduxState } from '../../../../store/store';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  Text,
  ModalFooter,
} from '../../../component-library';

export default function TransactionAlreadyConfirmed() {
  const {
    hideModal,
    props: { originalTransactionId },
  } = useModalProps();
  const t = useContext(I18nContext);
  const dispatch = useDispatch();
  const transaction: TransactionMeta = useSelector(
    (state: MetaMaskReduxState) =>
      // TODO: Replace `any` with type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (getTransaction as any)(state, originalTransactionId),
  );
  const rpcPrefs = useSelector(getRpcPrefsForCurrentProvider);

  const viewTransaction = () => {
    // TODO: Fix getBlockExplorerLink arguments compatible with the actual controller types
    const blockExplorerLink = getBlockExplorerLink(
      // TODO: Replace `any` with type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      transaction as any,
      rpcPrefs,
    );
    global.platform.openTab({
      url: blockExplorerLink,
    });
    dispatch(hideModal());
  };

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
          onCancel={viewTransaction}
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
