import React from 'react';
import {
  ButtonPrimary,
  Checkbox,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
} from '../../component-library';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { AccountListItem } from '../index';
import { getUnconnectedAccounts } from '../../../selectors/selectors';
import { useSelector } from 'react-redux';

// Maps to localizations for title and text
export enum ConnectAccountsType {
  Account = 'disconnectAllAccountsText',
  Snap = 'disconnectAllSnapsText',
}

export interface AccountType {
  name: string;
  address: string;
  balance: string;
  keyring: KeyringType;
  label?: string;
}

export interface KeyringType {
  type: string;
}

export const ConnectAccountsModal = ({
  type,
  onClick,
  onClose,
}: {
  type: ConnectAccountsType;
  onClick: () => void;
  onClose: () => void;
}) => {
  const t = useI18nContext();
  const unconnectedAccounts = useSelector(getUnconnectedAccounts);

  return (
    <Modal isOpen onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader onClose={onClose}>Connect more accounts</ModalHeader>
        <ModalBody>
          <Checkbox isChecked={true} label={t('selectAll')} />
          {unconnectedAccounts.map((account: AccountType) => (
            <AccountListItem
              onClick={() => {
                onClick();
              }}
              identity={account}
              key={account.address}
              closeMenu={onClose}
              startAccessory={<Checkbox/>}
            />
          ))}
        </ModalBody>
        <ModalFooter>
          <ButtonPrimary onClick={onClick} block>
            {t('confirm')}
          </ButtonPrimary>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
