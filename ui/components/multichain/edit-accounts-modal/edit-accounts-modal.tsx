import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { TextVariant } from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  getInternalAccounts,
  getNonTestNetworks,
  getTestNetworks,
  getUpdatedAndSortedAccounts,
} from '../../../selectors';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  Checkbox,
  Text,
  Box,
} from '../../component-library';
import { AccountListItem } from '..';
import {
  EthAccountType,
  InternalAccount,
  KeyringAccountType,
} from '@metamask/keyring-api';
import { MergedInternalAccount } from '../../../selectors/selectors.types';
import { mergeAccounts } from '../account-list-menu/account-list-menu';

type SendPageYourAccountsProps = {
  allowedAccountTypes?: KeyringAccountType[];
};

const defaultAllowedAccountTypes = [EthAccountType.Eoa, EthAccountType.Erc4337];

export const EditAccountsModal = ({
  onClose,
  allowedAccountTypes = defaultAllowedAccountTypes,
}: {
  onClose: () => void;
  allowedAccountTypes: SendPageYourAccountsProps;
}) => {
  const t = useI18nContext();
  const accounts = useSelector(getUpdatedAndSortedAccounts);
  const internalAccounts = useSelector(getInternalAccounts);
  const mergedAccounts: MergedInternalAccount[] = useMemo(() => {
    return mergeAccounts(accounts, internalAccounts).filter(
      (account: InternalAccount) => allowedAccountTypes.includes(account.type),
    );
  }, [accounts, internalAccounts]);
  return (
    <Modal
      isOpen
      onClose={() => {
        onClose();
      }}
      data-testid="edit-accounts-modal"
      className="edit-accounts-modal"
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader
          onClose={() => {
            onClose();
          }}
        >
          {t('editAccounts')}
        </ModalHeader>
        <Box padding={4}>
          <Checkbox
            label={t('selectAll')}
            isChecked
            gap={4}
            // onClick={() => (allAreSelected() ? deselectAll() : selectAll())}
            // isIndeterminate={isIndeterminate}
          />
        </Box>
        {mergedAccounts.map((account: any) => (
          <AccountListItem
            account={account}
            key={account.address}
            isPinned={Boolean(account.pinned)}
            startAccessory={<Checkbox isChecked />}
            onClick={() => console.log('jj')}
          />
        ))}
      </ModalContent>
    </Modal>
  );
};
