import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
  EthAccountType,
  InternalAccount,
  KeyringAccountType,
} from '@metamask/keyring-api';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  getInternalAccounts,
  getUpdatedAndSortedAccounts,
} from '../../../selectors';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  Checkbox,
  Box,
} from '../../component-library';
import { AccountListItem } from '..';
import { MergedInternalAccount } from '../../../selectors/selectors.types';
import { mergeAccounts } from '../account-list-menu/account-list-menu';

type EditAccountsModalProps = {
  onClose: () => void;
  allowedAccountTypes?: KeyringAccountType[];
};

const defaultAllowedAccountTypes: KeyringAccountType[] = [
  EthAccountType.Eoa,
  EthAccountType.Erc4337,
];

export const EditAccountsModal = ({
  onClose,
  allowedAccountTypes = defaultAllowedAccountTypes,
}: EditAccountsModalProps) => {
  const t = useI18nContext();
  const accounts = useSelector(getUpdatedAndSortedAccounts);
  const internalAccounts = useSelector(getInternalAccounts);

  const mergedAccounts: MergedInternalAccount[] = useMemo(() => {
    return mergeAccounts(accounts, internalAccounts).filter(
      (account: InternalAccount) => allowedAccountTypes.includes(account.type),
    );
  }, [accounts, internalAccounts, allowedAccountTypes]); // Add allowedAccountTypes to dependency array

  return (
    <Modal
      isOpen
      onClose={onClose} // Simplified inline function
      data-testid="edit-accounts-modal"
      className="edit-accounts-modal"
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader onClose={onClose}>{t('editAccounts')}</ModalHeader>
        <Box padding={4}>
          <Checkbox
            label={t('selectAll')}
            isChecked
            gap={4}
            // Uncomment and implement these if needed:
            // onClick={() => (allAreSelected() ? deselectAll() : selectAll())}
            // isIndeterminate={isIndeterminate}
          />
        </Box>
        {mergedAccounts.map((account) => (
          <AccountListItem
            account={account}
            key={account.address}
            isPinned={Boolean(account.pinned)}
            startAccessory={<Checkbox isChecked />}
            onClick={() => console.log(null)}
            selected={false}
          />
        ))}
      </ModalContent>
    </Modal>
  );
};
