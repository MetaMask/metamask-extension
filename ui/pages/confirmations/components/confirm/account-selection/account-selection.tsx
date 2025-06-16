import React, { useCallback, useMemo } from 'react';
import { Hex } from '@metamask/utils';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { isEvmAccountType } from '@metamask/keyring-api';
import { useSelector } from 'react-redux';

import AccountListItem from '../../../../../components/multichain/account-list-item/account-list-item';
import IconButton from '../../../../../components/ui/icon-button/icon-button-round';
import {
  BlockSize,
  Display,
  JustifyContent,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import {
  Box,
  Checkbox,
  Icon,
  IconName,
  Text,
} from '../../../../../components/component-library';
import { getInternalAccounts } from '../../../../../selectors';
import { useI18nContext } from '../../../../../hooks/useI18nContext';

export function AccountSelection({
  selectedAccounts = [],
  setSelectedAccounts,
  closeAccountSelection,
}: {
  selectedAccounts?: Hex[];
  setSelectedAccounts: (accounts: Hex[]) => void;
  closeAccountSelection: () => void;
}) {
  const t = useI18nContext();
  const accounts = useSelector(getInternalAccounts);
  const evmAccounts = accounts.filter((acc) => isEvmAccountType(acc.type));

  const onSelectAllChange = useCallback(
    (event) => {
      const checked = event.target.checked;
      if (checked) {
        setSelectedAccounts(evmAccounts.map((acc) => acc.address as Hex));
      } else {
        setSelectedAccounts([]);
      }
    },
    [evmAccounts, setSelectedAccounts],
  );

  const handleAccountClick = useCallback(
    (account: InternalAccount) => {
      const address = account.address as Hex;
      let newSelectedAccount: Hex[] = [];
      if (selectedAccounts.includes(address)) {
        newSelectedAccount = selectedAccounts.filter(
          (acc) => acc !== account.address,
        );
      } else {
        newSelectedAccount = [...selectedAccounts, address];
      }
      setSelectedAccounts(newSelectedAccount);
    },
    [selectedAccounts, setSelectedAccounts],
  );

  const allAreSelected = useMemo(() => {
    const unSelectedAccount = evmAccounts.find(
      (acc) => !selectedAccounts.includes(acc.address as Hex),
    );
    return unSelectedAccount === undefined;
  }, [evmAccounts, selectedAccounts]);

  const isSomeSelected = useMemo(
    () =>
      evmAccounts.some((acc) => selectedAccounts.includes(acc.address as Hex)),
    [evmAccounts, selectedAccounts],
  );

  return (
    <>
      <Box marginBottom={2}>
        <IconButton
          Icon={<Icon name={IconName.ArrowLeft} />}
          onClick={closeAccountSelection}
          className="account-selection__close"
          label=""
        />
        <Text variant={TextVariant.headingMd}>
          {t('smartAccountEditAccounts')}
        </Text>
      </Box>
      <Box
        display={Display.Flex}
        justifyContent={JustifyContent.flexStart}
        marginBottom={4}
        marginTop={2}
        marginInlineStart={2}
        width={BlockSize.Full}
      >
        <Checkbox
          isChecked={allAreSelected}
          isIndeterminate={isSomeSelected}
          label="Select All"
          onChange={onSelectAllChange}
        />
      </Box>
      <Box
        height={BlockSize.EightTwelfths}
        className="account-selection__accounts-list"
      >
        {evmAccounts.map((acc) => {
          const isSelected = selectedAccounts.includes(acc.address as Hex);
          return (
            <AccountListItem
              account={acc as any}
              isActive={true}
              onClick={handleAccountClick}
              selected={isSelected}
              shouldScrollToWhenSelected={false}
              showSelectionIndicator={false}
              startAccessory={
                <Checkbox
                  isChecked={isSelected}
                  className="account-selection__select"
                />
              }
            />
          );
        })}
      </Box>
    </>
  );
}
