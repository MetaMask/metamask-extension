import React, { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { KeyringTypes } from '@metamask/keyring-controller';
import { EthKeyring, InternalAccount } from '@metamask/keyring-api';
import { Json } from '@metamask/utils';
import Card from '../../../ui/card';
import {
  Box,
  IconName,
  Icon,
  Text,
  IconSize,
  AvatarAccount,
  AvatarAccountSize,
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
import { getMetaMaskKeyrings } from '../../../../selectors/selectors';
import { getInternalAccounts } from '../../../../selectors/accounts';

export const SRPList = () => {
  const onClick = () => {
    console.log('clicked');
  };

  const keyrings: (EthKeyring<Json> & {
    id: string;
    typeIndex: number;
    accounts: string[];
  })[] = useSelector(getMetaMaskKeyrings);
  const accounts: InternalAccount[] = useSelector(getInternalAccounts);
  const accountNameByAddress: Record<string, string> = useMemo(
    () =>
      accounts.reduce(
        (acc: Record<string, string>, account: InternalAccount) => ({
          ...acc,
          [account.address]: account.metadata.name,
        }),
        {},
      ),
    [accounts],
  );
  const nonEmptyHDKeyrings = useMemo(
    () =>
      keyrings.filter(
        (keyring) =>
          keyring.type === KeyringTypes.hd && keyring.accounts.length > 0,
      ),
    [keyrings],
  );

  const [showAccounts, setShowAccounts] = useState<Record<string, boolean>>(
    nonEmptyHDKeyrings.reduce(
      (acc: Record<string, boolean>, keyring) => ({
        ...acc,
        [keyring.id]: false,
      }),
      {},
    ),
  );

  return (
    <Box padding={4}>
      {nonEmptyHDKeyrings.map((keyring) => (
        <Card
          onClick={onClick}
          className="select-srp-container"
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
              <Text>Secret Phrase {keyring.typeIndex}</Text>
              <Text
                variant={TextVariant.bodySm}
                color={TextColor.primaryDefault}
                className="srp-list-show-accounts"
                onClick={() =>
                  setShowAccounts({
                    ...showAccounts,
                    [keyring.id]: !showAccounts[keyring.id],
                  })
                }
              >
                {showAccounts[keyring.id] ? 'Hide' : 'Show'}{' '}
                {keyring.accounts.length} account
                {keyring.accounts.length > 1 ? 's' : ''}
              </Text>
            </Box>
            <Icon name={IconName.ArrowRight} size={IconSize.Sm} />
          </Box>
          {showAccounts[keyring.id] && (
            <Box>
              <Box
                width={BlockSize.Full}
                className="srp-list-divider"
                marginTop={2}
                marginBottom={2}
              />
              {keyring.accounts.map((address: string) => (
                <Box
                  display={Display.Flex}
                  flexDirection={FlexDirection.Row}
                  alignItems={AlignItems.center}
                >
                  <AvatarAccount
                    address={address}
                    size={AvatarAccountSize.Xs}
                  />
                  <Text
                    variant={TextVariant.bodySm}
                    color={TextColor.textAlternative}
                    paddingLeft={3}
                  >
                    {accountNameByAddress[address]}
                  </Text>
                </Box>
              ))}
            </Box>
          )}
        </Card>
      ))}
    </Box>
  );
};
