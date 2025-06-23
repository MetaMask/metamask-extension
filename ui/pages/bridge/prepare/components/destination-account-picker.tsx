import React, { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  TextField,
  Box,
  Text,
  Button,
  ButtonSize,
  ButtonVariant,
} from '../../../../components/component-library';
import {
  getSelectedInternalAccount,
  getInternalAccounts,
  isSolanaAccount,
} from '../../../../selectors';
import {
  BlockSize,
  Display,
  FlexDirection,
  AlignItems,
  TextAlign,
  JustifyContent,
  BackgroundColor,
} from '../../../../helpers/constants/design-system';
import { t } from '../../../../../shared/lib/translate';
import { DestinationAccount } from '../types';
import { useExternalAccountResolution } from '../../hooks/useExternalAccountResolution';
import DestinationSelectedAccountListItem from './destination-selected-account-list-item';
import DestinationAccountListItem from './destination-account-list-item';
import { ExternalAccountListItem } from './external-account-list-item';

type DestinationAccountPickerProps = {
  onAccountSelect: (account: DestinationAccount | null) => void;
  selectedSwapToAccount: DestinationAccount | null;
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

  const { externalAccount } = useExternalAccountResolution({
    searchQuery,
    isDestinationSolana,
    accounts,
  });

  const filteredAccounts = useMemo(
    () =>
      accounts.filter((account) => {
        const matchesSearchByName = account.metadata.name
          .toLowerCase()
          .includes(searchQuery.toLowerCase());

        const matchesSearchByAddress = account.address
          .toLowerCase()
          .includes(searchQuery.toLowerCase());

        const matchesSearch = matchesSearchByName || matchesSearchByAddress;

        const matchesChain = isDestinationSolana
          ? isSolanaAccount(account)
          : !isSolanaAccount(account);

        return matchesSearch && matchesChain;
      }),
    [accounts, isDestinationSolana, searchQuery],
  );

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
          boxShadow: 'var(--shadow-size-sm) var(--color-shadow-default)',
        }}
      >
        <Box
          className="destination-account-picker__selected"
          width={BlockSize.Full}
        >
          <DestinationSelectedAccountListItem
            account={selectedSwapToAccount}
            // @ts-expect-error: Type mismatch between InternalAccount and expected account type - functionality works but needs type alignment
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
            style={{
              padding: '5px',
              color: 'var(--color-icon-alternative)',
              textDecoration: 'none',
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
          boxShadow: 'var(--shadow-size-sm) var(--color-shadow-default)',
        }}
      >
        <TextField
          // @ts-expect-error: TextField component expects different props than provided - works but needs type update
          placeholder={
            isDestinationSolana
              ? t('destinationAccountPickerSearchPlaceholderToSolana')
              : t('destinationAccountPickerSearchPlaceholderToMainnet')
          }
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
      {/* Invisible buffer to match selected account height */}
      <Box style={{ height: '20px' }} />
      <Box
        className="destination-account-picker__list"
        backgroundColor={BackgroundColor.backgroundDefault}
        style={{
          position: 'absolute',
          top: '50px',
          left: 0,
          right: 0,
          maxHeight: '240px',
          overflowY: 'auto',
          borderRadius: '0 0 8px 8px',
          zIndex: 1000,
          boxShadow: 'var(--shadow-size-sm) var(--color-shadow-default)',
        }}
      >
        {filteredAccounts.map((account) => (
          <DestinationAccountListItem
            key={account.id}
            account={account}
            onClick={() => onAccountSelect(account)}
            // @ts-expect-error: Type mismatch in isSelected prop between InternalAccount and component expectations
            isSelected={account.id === selectedSwapToAccount?.id}
            showOptions={false}
          />
        ))}
        {externalAccount && (
          <ExternalAccountListItem
            key="external-account"
            account={externalAccount}
            selected={Boolean(
              selectedSwapToAccount &&
                (selectedSwapToAccount as DestinationAccount).address ===
                  externalAccount.address,
            )}
            onClick={() => onAccountSelect(externalAccount)}
          />
        )}

        {filteredAccounts.length === 0 && !externalAccount && (
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
