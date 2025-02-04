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
        style={{
          borderRadius: '8px',
          border: '2px solid #E2E4E929',
          boxShadow: '0px 0px 24px #E2E4E940',
          width: '90%',
          marginLeft: 'auto',
          marginRight: 'auto',
          marginTop: '100px',
        }}
      >
        <Box
          className="swap-to-account-picker__selected"
          width={BlockSize.Full}
        >
          <AccountListItem
            account={selectedSwapToAccount}
            isSelected={selectedSwapToAccount.id === selectedAccount?.id}
            showOptions={false}
            disableHover
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
            style={{
              paddingRight: '8px',
              color: 'var(--color-icon-alternative)',
              textDecoration: 'none',
              // not working
              '&:hover': {
                textDecoration: 'none',
                color: 'var(--color-icon-default)',
              },
            }}
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
      style={{
        borderRadius: '8px',
        border: '2px solid #E2E4E929',
        boxShadow: '0px 0px 24px #E2E4E940',
        width: '90%',
        marginLeft: 'auto',
        marginRight: 'auto',
        marginTop: '100px',
      }}
    >
      <Box
        className="search-container"
        style={{
          height: '45px',
          borderBottomWidth: '1px',
          borderBottomStyle: 'solid',
          borderBottomColor: '#B7BBC866',
          alignItems: 'center',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <TextFieldSearch
          placeholder="Receiving address or SNS"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          clearButtonOnClick={() => setSearchQuery('')}
          className="text-field-search"
          style={{
            width: '100%',
            borderRadius: 0,
            borderWidth: 0,
            color: '#9FA6AE',
          }}
        />
      </Box>

      <Box
        className="swap-to-account-picker__list"
        style={{ minHeight: '79px' }}
      >
        {filteredAccounts.map((account) => (
          <AccountListItem
            key={account.id}
            // TODO: fix below error.
            // @ts-expect-error: todo
            account={account}
            onClick={() => onAccountSelect(account)}
            isSelected={account.id === selectedAccount?.id}
            showOptions={false}
          />
        ))}

        {filteredAccounts.length === 0 && (
          <Box
            display={Display.Flex}
            style={{
              height: '100%',
              width: '100%',
              minHeight: '79px',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Text textAlign={TextAlign.Center}>
              No matching accounts found.
            </Text>
          </Box>
        )}
      </Box>
    </Box>
  );
};
