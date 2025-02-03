import * as React from 'react';
import { useSelector } from 'react-redux';
import { TextFieldSearch, Box, Text } from '../../component-library';
import { AccountListItem } from '../account-list-item';
import { getSelectedInternalAccount } from '../../../selectors';
import { InternalAccount } from '@metamask/keyring-internal-api';
import {
  BlockSize,
  Display,
  FlexDirection,
} from '../../../helpers/constants/design-system';
import { useState } from 'react';

type SwapToAccountPickerProps = {
  accounts: InternalAccount[];
  onAccountSelect: (account: InternalAccount) => void;
  chainType: 'evm' | 'solana';
};

export const SwapToAccountPicker = ({
  accounts,
  onAccountSelect,
  chainType,
}: SwapToAccountPickerProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const selectedAccount = useSelector(getSelectedInternalAccount);

  const filteredAccounts = accounts.filter((account) => {
    const matchesSearch = account.metadata.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    // TODO: Replace with actual chain type check once Solana support is added
    const matchesChain =
      chainType === 'solana'
        ? account.metadata.keyring?.type === 'Solana'
        : account.metadata.keyring?.type !== 'Solana';

    return matchesSearch && matchesChain;
  });

  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      width={BlockSize.Full}
      className="swap-to-account-picker"
    >
      <Box padding={4}>
        <TextFieldSearch
          placeholder="Search accounts"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          clearButtonOnClick={() => setSearchQuery('')}
        />
      </Box>

      <Box className="swap-to-account-picker__list">
        {filteredAccounts.map((account) => (
          <AccountListItem
            key={account.id}
            account={account}
            onClick={() => onAccountSelect(account)}
            isSelected={account.id === selectedAccount?.id}
            showOptions={false}
          />
        ))}

        {filteredAccounts.length === 0 && (
          <Text padding={4} textAlign="center">
            No matching accounts found
          </Text>
        )}
      </Box>
    </Box>
  );
};
