import React, { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { KeyringMetadata, KeyringObject } from '@metamask/keyring-controller';
import Card from '../../../ui/card';
import {
  Box,
  IconName,
  Icon,
  Text,
  IconSize,
} from '../../../component-library';
import {
  JustifyContent,
  Display,
  TextColor,
  FlexDirection,
  AlignItems,
  BlockSize,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import {
  getMetaMaskAccounts,
  getMetaMaskHdKeyrings,
} from '../../../../selectors/selectors';
import { InternalAccountWithBalance } from '../../../../selectors/selectors.types';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { SrpListItem } from './srp-list-item';

type KeyringObjectWithMetadata = KeyringObject & { metadata: KeyringMetadata };

export const SrpList = ({
  onActionComplete,
  hideShowAccounts,
}: {
  onActionComplete: (id: string) => void;
  hideShowAccounts?: boolean;
}) => {
  const t = useI18nContext();
  const hdKeyrings: KeyringObjectWithMetadata[] = useSelector(
    getMetaMaskHdKeyrings,
  );
  // This selector will return accounts with nonEVM balances as well.
  const accountsWithBalances: Record<string, InternalAccountWithBalance> =
    useSelector(getMetaMaskAccounts);

  const showAccountsInitState = useMemo(
    () => new Array(hdKeyrings.length).fill(hideShowAccounts),
    [hdKeyrings, hideShowAccounts],
  );

  const [showAccounts, setShowAccounts] = useState<boolean[]>(
    showAccountsInitState,
  );

  const showHideText = (index: number, numberOfAccounts: number): string => {
    if (numberOfAccounts > 1) {
      return showAccounts[index]
        ? t('SrpListHideAccounts', [numberOfAccounts])
        : t('SrpListShowAccounts', [numberOfAccounts]);
    }
    return showAccounts[index]
      ? t('SrpListHideSingleAccount', [numberOfAccounts])
      : t('SrpListShowSingleAccount', [numberOfAccounts]);
  };

  return (
    <Box className="srp-list__container" padding={4} data-testid="srp-list">
      {hdKeyrings.map((keyring, index) => (
        <Card
          key={`srp-${keyring.metadata.id}`}
          data-testid={`hd-keyring-${keyring.metadata.id}`}
          onClick={() => onActionComplete(keyring.metadata.id)}
          className="select-srp__container"
          marginBottom={3}
        >
          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Row}
            alignItems={AlignItems.center}
            justifyContent={JustifyContent.spaceBetween}
            paddingLeft={4}
          >
            <Box>
              <Text>{t('srpListName', [index + 1])}</Text>
              {!hideShowAccounts && (
                <Text
                  variant={TextVariant.bodySm}
                  color={TextColor.primaryDefault}
                  className="srp-list__show-accounts"
                  onClick={(event: React.MouseEvent) => {
                    event.stopPropagation();
                    setShowAccounts((prevState) =>
                      prevState.map((value, i) =>
                        i === index ? !value : value,
                      ),
                    );
                  }}
                >
                  {showHideText(index, keyring.accounts.length)}
                </Text>
              )}
            </Box>
            <Icon name={IconName.ArrowRight} size={IconSize.Sm} />
          </Box>
          {showAccounts[index] && (
            <Box>
              <Box
                width={BlockSize.Full}
                className="srp-list__divider"
                marginTop={2}
                marginBottom={2}
              />
              {keyring.accounts.map((address: string) => {
                const account = accountsWithBalances[address];
                return (
                  <SrpListItem
                    key={`account-${account.id}`}
                    account={account}
                  />
                );
              })}
            </Box>
          )}
        </Card>
      ))}
    </Box>
  );
};
