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
} from '../../../../components/component-library';
import { getSelectedInternalAccount } from '../../../../selectors';
import {
  BlockSize,
  Display,
  FlexDirection,
  AlignItems,
  TextAlign,
  JustifyContent,
  BackgroundColor,
} from '../../../../helpers/constants/design-system';
import DestinationSelectedAccountListItem from './destination-selected-account-list-item';
import DestinationAccountListItem from './destination-account-list-item';
import { t } from '../../../../../app/scripts/translate';
import { getInternalAccounts } from '../../../../selectors';

type DestinationAccountPickerProps = {
  onAccountSelect: (account: InternalAccount | null) => void;
  selectedSwapToAccount: InternalAccount | null;
  isDestinationSolana: boolean;
};

// TODO: move this and everything else in the bridge folder.
export const DestinationAccountPicker = ({
  onAccountSelect,
  selectedSwapToAccount,
  isDestinationSolana,
}: DestinationAccountPickerProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const selectedAccount = useSelector(getSelectedInternalAccount);
  const accounts = useSelector(getInternalAccounts);

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
        backgroundColor={BackgroundColor.backgroundDefault}
        style={{
          height: '70px',
          borderRadius: '8px',
          marginLeft: 'auto',
          marginRight: 'auto',
          boxShadow:
            '0px 0px 2px 0px #E2E4E9, 0px 0px 16px 0px rgba(226, 228, 233, 0.16)',
        }}
      >
        <Box
          className="destination-account-picker__selected"
          width={BlockSize.Full}
        >
          <DestinationSelectedAccountListItem
            account={selectedSwapToAccount}
            // TODO: fix
            // @ts-expect-error-error: not working
            isSelected={selectedSwapToAccount.id === selectedAccount?.id}
            showOptions={false}
            disableHover
          />
        </Box>
        <Box className="deselect-button-container" paddingRight={5}>
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
      backgroundColor={BackgroundColor.backgroundDefault}
      style={{
        borderRadius: '8px',
        position: 'relative',
        marginLeft: 'auto',
        marginRight: 'auto',
        boxShadow:
          '0px 0px 2px 0px #E2E4E9, 0px 0px 16px 0px rgba(226, 228, 233, 0.16)',
      }}
    >
      <Box
        className="search-container"
        width={BlockSize.Full}
        display={Display.Flex}
        alignItems={AlignItems.center}
        justifyContent={JustifyContent.center}
        backgroundColor={BackgroundColor.backgroundDefault}
        style={{
          height: '50px',
          borderBottomWidth: '1px',
          borderBottomStyle: 'solid',
          borderBottomColor: '#B7BBC866',
          borderRadius: '8px 8px 0 0',
        }}
      >
        {/* // TODO: the above box is redundant. */}
        <TextField
          // @ts-expect-error-error:
          placeholder={t('destinationAccountPickerSearchPlaceholder')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          clearButtonOnClick={() => setSearchQuery('')}
          className="text-field-search"
          style={{
            width: '98%',
            borderRadius: 0,
            borderWidth: 0,
            color: 'var(--color-text-alternative)',
          }}
        />
      </Box>
      <Box
        className="destination-account-picker__list"
        backgroundColor={BackgroundColor.backgroundDefault}
        style={{
          position: 'absolute',
          top: '45px',
          left: 0,
          right: 0,
          minHeight: '79px',
          maxHeight: '240px',
          overflowY: 'auto',
          borderRadius: '0 0 8px 8px',
          zIndex: 1000,
          boxShadow:
            '0px 0px 2px 0px #E2E4E9, 0px 0px 16px 0px rgba(226, 228, 233, 0.16)',
        }}
      >
        {filteredAccounts.map((account) => (
          <DestinationAccountListItem
            key={account.id}
            // TODO: fix account and swapToAccount type errors. functionality works.
            // @ts-expect-error
            account={account}
            onClick={() => onAccountSelect(account)}
            // @ts-expect-error
            isSelected={account.id === selectedSwapToAccount?.id} // Fixed check
            showOptions={false}
          />
        ))}

        {filteredAccounts.length === 0 && (
          <Box
            display={Display.Flex}
            style={{
              minHeight: '79px',
            }}
            width={BlockSize.Full}
            height={BlockSize.Full}
            justifyContent={JustifyContent.center}
            alignItems={AlignItems.center}
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
