import React, { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { isSolanaChainId, isBitcoinChainId } from '@metamask/bridge-controller';
import { Icon, IconName, IconSize } from '@metamask/design-system-react';
import { isTronChainId } from '../../../../ducks/bridge/utils';
import {
  TextField,
  Text,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalProps,
  ModalBody,
  ModalHeader,
} from '../../../../components/component-library';
import {
  BackgroundColor,
  BorderRadius,
  TextAlign,
  TextColor,
} from '../../../../helpers/constants/design-system';
import { t } from '../../../../../shared/lib/translate';
import { getToAccounts, getToChain } from '../../../../ducks/bridge/selectors';
import { useExternalAccountResolution } from '../../hooks/useExternalAccountResolution';
import type { DestinationAccount } from '../types';
import DestinationAccountListItem from './destination-account-list-item';

type DestinationAccountPickerProps = {
  onAccountSelect: (account: DestinationAccount | null) => void;
  selectedAccount: DestinationAccount | null;
};

export const DestinationAccountPickerModal = ({
  onAccountSelect,
  selectedAccount,
  isOpen,
  onClose,
}: DestinationAccountPickerProps & Pick<ModalProps, 'isOpen' | 'onClose'>) => {
  const [searchQuery, setSearchQuery] = useState('');
  const accounts = useSelector(getToAccounts);
  const toChain = useSelector(getToChain);
  const isDestinationSolana = toChain?.chainId
    ? isSolanaChainId(toChain.chainId)
    : false;
  const isDestinationBitcoin = toChain?.chainId
    ? isBitcoinChainId(toChain.chainId)
    : false;

  const isDestinationTron = toChain?.chainId
    ? isTronChainId(toChain.chainId)
    : false;

  const externalAccount = useExternalAccountResolution({
    searchQuery,
    isDestinationSolana,
    isDestinationBitcoin,
    isDestinationTron,
  });

  const filteredAccounts = useMemo(
    () =>
      accounts.filter((account) => {
        const matchesSearchByName = account.displayName
          .toLowerCase()
          .includes(searchQuery.trim().toLowerCase());

        const matchesSearchByAddress = account.address
          .toLowerCase()
          .includes(searchQuery.trim().toLowerCase());

        const matchesSearch = matchesSearchByName || matchesSearchByAddress;

        return matchesSearch;
      }),
    [accounts, searchQuery],
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setSearchQuery('');
        onClose();
      }}
      data-testid="destination-account-picker-modal"
    >
      <ModalOverlay />

      <ModalContent paddingTop={4} paddingBottom={4} gap={3}>
        <ModalHeader onClose={onClose}>{t('recipient')}</ModalHeader>
        <TextField
          autoFocus
          data-testid="destination-account-picker-modal-search-input"
          placeholder={
            (isDestinationSolana
              ? t('destinationAccountPickerSearchPlaceholderToSolana')
              : t('destinationAccountPickerSearchPlaceholderToMainnet')) ??
            undefined
          }
          marginInline={4}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          backgroundColor={BackgroundColor.backgroundSubsection}
          borderRadius={BorderRadius.XL}
          borderWidth={0}
          color={TextColor.textAlternative}
          inputProps={{
            disableStateStyles: true,
          }}
          style={{
            minHeight: 48,
            marginBottom: 12,
            outline: 'none',
          }}
          startAccessory={<Icon name={IconName.Search} size={IconSize.Md} />}
        />
        <ModalBody
          paddingRight={0}
          paddingLeft={0}
          data-testid="destination-account-picker-modal-body"
        >
          {filteredAccounts.map((account) => (
            <DestinationAccountListItem
              key={account.id + account.address + account.displayName}
              account={account}
              onClick={() => {
                onAccountSelect(account);
              }}
              selected={
                selectedAccount
                  ? account.address.toLowerCase() ===
                    (
                      selectedAccount as DestinationAccount
                    ).address.toLowerCase()
                  : false
              }
              isExternal={false}
            />
          ))}
          {externalAccount && (
            <DestinationAccountListItem
              key="external-account"
              account={externalAccount}
              onClick={() => {
                onAccountSelect(externalAccount);
              }}
              selected={
                selectedAccount
                  ? externalAccount.address.toLowerCase() ===
                    (
                      selectedAccount as DestinationAccount
                    ).address.toLowerCase()
                  : false
              }
              isExternal={true}
            />
          )}

          {filteredAccounts.length === 0 && !externalAccount && (
            <Text textAlign={TextAlign.Center}>
              {searchQuery
                ? t('destinationAccountPickerNoMatching')
                : t('destinationAccountPickerNoEligible')}
            </Text>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
