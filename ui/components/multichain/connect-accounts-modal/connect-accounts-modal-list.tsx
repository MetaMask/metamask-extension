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

export const ConnectAccountsList = ({
  onClose,
  allAreSelected,
  deselectAll,
  selectAll,
  handleAccountClick,
  selectedAccounts,
  accounts,
  checked,
  isIndeterminate,
}: {
  type: ConnectAccountsType;
  onClose: () => void;
}) => {
  const t = useI18nContext();

  return (
    <Modal isOpen onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader onClose={onClose}>Connect more accounts</ModalHeader>
        <ModalBody>
          <Checkbox
            label={t('selectAll')}
            isChecked={checked}
            onClick={() => (allAreSelected() ? deselectAll() : selectAll())}
            isIndeterminate={isIndeterminate}
          />
          {accounts.map((account: AccountType) => {
            const isSelectedAccount = selectedAccounts?.includes(
              account.address,
            );
            return (
              <AccountListItem
                onClick={() => handleAccountClick(account.address)}
                identity={account}
                key={account.address}
                closeMenu={onClose}
                startAccessory={<Checkbox isChecked={isSelectedAccount} />}
              />
            );
          })}
        </ModalBody>
        <ModalFooter>
          <ButtonPrimary onClick={() => console.log(selectedAccounts)} block>
            {t('confirm')}
          </ButtonPrimary>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
