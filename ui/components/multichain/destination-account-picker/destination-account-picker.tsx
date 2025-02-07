import * as React from 'react';
import { useSelector } from 'react-redux';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { useState } from 'react';
import {
  TextField,
  Box,
  Text,
  Button,
  ButtonSize,
  ButtonVariant,
} from '../../component-library';
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
import DestinationAccountListItem from './destination-account-list-item';
import { t } from '../../../../app/scripts/translate';
import { getInternalAccounts } from '../../../selectors';

type DestinationAccountPickerProps = {
  onAccountSelect: (account: InternalAccount | null) => void;
  selectedSwapToAccount: InternalAccount | null;
  isDestinationSolana: boolean;
};

export const DestinationAccountPicker = ({
  onAccountSelect,
  selectedSwapToAccount,
  isDestinationSolana,
}: DestinationAccountPickerProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const selectedAccount = useSelector(getSelectedInternalAccount);
  const accounts = useSelector(getInternalAccounts);

  console.log('accounts', accounts);
  const filteredAccounts = accounts.filter((account) => {
    const matchesSearch = account.metadata.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    const matchesChain = isDestinationSolana
      ? account.type === 'solana:data-account'
      : account.type !== 'solana:data-account';

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
          backgroundColor: 'var(--color-background-default)',
          marginLeft: 'auto',
          marginRight: 'auto',
        }}
      >
        <Box
          className="destination-account-picker__selected"
          width={BlockSize.Full}
        >
          <DestinationAccountListItem
            account={selectedSwapToAccount}
            // TODO: fix
            // @ts-expect-error-error: not working
            isSelected={selectedSwapToAccount.id === selectedAccount?.id}
            showOptions={false}
            disableHover
          />
        </Box>
        <Box
          className="deselect-button-container"
          style={{ paddingRight: '20px' }}
        >
          <Button
            onClick={() => onAccountSelect(null)}
            aria-label="Deselect account"
            variant={ButtonVariant.Link}
            size={ButtonSize.Sm}
            className="deselect-button"
            iconName="close-outline"
            style={{
              padding: '5px',
              color: 'var(--color-icon-alternative)',
              textDecoration: 'none',
              // TODO: fix
              // @ts-expect-error-error: not working
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
      className="destination-account-picker"
      style={{
        borderRadius: '8px',
        backgroundColor: 'var(--color-background-default)',
        marginLeft: 'auto',
        marginRight: 'auto',
        // marginTop: '100px',
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
        <TextField
          // @ts-expect-error-error:
          placeholder={t('destinationAccountPickerSearchPlaceholder')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          clearButtonOnClick={() => setSearchQuery('')}
          className="text-field-search"
          style={{
            width: '100%',
            borderRadius: 0,
            borderWidth: 0,
            color: 'var(--color-text-alternative)',
          }}
        />
      </Box>

      <Box
        className="destination-account-picker__list"
        style={{
          minHeight: '79px',
          maxHeight: '195px',
          overflowY: 'auto',
        }}
      >
        {filteredAccounts.map((account) => (
          <AccountListItem
            key={account.id}
            account={account}
            onClick={() => onAccountSelect(account)}
            isSelected={account.id === selectedSwapToAccount?.id} // Fixed check
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
              {searchQuery
                ? t('destinationAccountPickerNoMatching')
                : t('destinationAccountPickerNoEligible')}
            </Text>
          </Box>
        )}
      </Box>
    </Box>
  );
};
