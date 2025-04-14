// TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
import React, { useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getBlockExplorerLink } from '@metamask/etherscan-link';
import { type TransactionMeta } from '@metamask/transaction-controller';
import {
  getRpcPrefsForCurrentProvider,
  getTransaction,
} from '../../../../selectors';
import { useModalProps } from '../../../../hooks/useModalProps';

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
import { MetaMaskReduxState } from '../../../../store/store';

// TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function TransactionAlreadyConfirmed() {
  const {
    hideModal,
    props: { originalTransactionId },
  } = useModalProps();
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
  // eslint-disable-next-line id-length
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
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
    // eslint-disable-next-line no-restricted-globals
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
