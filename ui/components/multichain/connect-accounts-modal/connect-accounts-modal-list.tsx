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
} from '../../component-library';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { AccountListItem } from '..';
import { ConnectAccountsListProps } from './connect-account-modal.types';

export const ConnectAccountsList: React.FC<ConnectAccountsListProps> = ({
  onClose,
  allAreSelected,
  deselectAll,
  selectAll,
  handleAccountClick,
  selectedAccounts,
  accounts,
  checked,
  isIndeterminate,
}) => {
  const t = useI18nContext();

  return (
    <Modal isOpen onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        {/* Todo: Replace this with i18 text */}
        <ModalHeader onClose={onClose}>Connect more accounts</ModalHeader>
        <ModalBody>
          <Checkbox
            label={t('selectAll')}
            isChecked={checked}
            onClick={() => (allAreSelected() ? deselectAll() : selectAll())}
            isIndeterminate={isIndeterminate}
          />
          {accounts.map((account) => {
            const isSelectedAccount = selectedAccounts.includes(
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
          {/* Todo: Implement onClick handler */}
          <ButtonPrimary onClick={() => console.log(selectedAccounts)} block>
            {t('confirm')}
          </ButtonPrimary>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
