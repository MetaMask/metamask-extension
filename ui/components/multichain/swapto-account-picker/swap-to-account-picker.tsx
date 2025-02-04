import * as React from 'react';
import { useSelector } from 'react-redux';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { useState } from 'react';
import { TextFieldSearch, Box, Text, Button } from '../../component-library';
import { AccountListItem } from '../account-list-item';
import { getSelectedInternalAccount } from '../../../selectors';
import {
  BlockSize,
  Display,
  FlexDirection,
  AlignItems,
  TextAlign,
  JustifyContent,
} from '../../../helpers/constants/design-system';

type SwapToAccountPickerProps = {
  accounts: InternalAccount[];
  onAccountSelect: (account: InternalAccount | null) => void;
  selectedSwapToAccount: InternalAccount | null;
  chainType: 'evm' | 'solana';
};

export const SwapToAccountPicker = ({
  accounts,
  onAccountSelect,
  selectedSwapToAccount,
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

  if (selectedSwapToAccount) {
    return (
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        alignItems={AlignItems.center}
        justifyContent={JustifyContent.spaceBetween}
        width={BlockSize.Full}
        className="swap-to-account-picker"
      >
        <Box
          className="swap-to-account-picker__selected"
          width={BlockSize.Full}
        >
          <AccountListItem
            account={selectedSwapToAccount}
            isSelected={selectedSwapToAccount.id === selectedAccount?.id}
            showOptions={false}
          />
        </Box>
        <Box className="deselect-button-container">
          <Button
            onClick={() => onAccountSelect(null)}
            aria-label="Deselect account"
            variant="link"
            size="sm"
            className="deselect-button"
            iconName="close-outline"
          >
            ✕
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      width={BlockSize.Full}
      className="swap-to-account-picker"
    >
      <Box className="search-container">
        <TextFieldSearch
          placeholder="Receiving address or SNS"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          clearButtonOnClick={() => setSearchQuery('')}
          className="text-field-search"
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
          <Text textAlign={TextAlign.Center}>No matching accounts found</Text>
        )}
      </Box>
    </Box>
  );
};
