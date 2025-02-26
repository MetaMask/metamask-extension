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
import { SRPListItem } from './srp-list-item';

type KeyringObjectWithMetadata = KeyringObject & { metadata: KeyringMetadata };

export const SRPList = ({
  onActionComplete,
  hideShowAccounts,
}: {
  onActionComplete: (id: string) => void;
  hideShowAccounts?: boolean;
}) => {
  const hdKeyrings: KeyringObjectWithMetadata[] = useSelector(
    getMetaMaskHdKeyrings,
  );
  // This selector will return accounts with nonEVM balances as well.
  const accountsWithBalances: Record<string, InternalAccountWithBalance> =
    useSelector(getMetaMaskAccounts);

  const showAccountsInitState = useMemo(
    () =>
      hdKeyrings.reduce(
        (acc: Record<string, boolean>, _, index) => ({
          ...acc,
          [index]: Boolean(hideShowAccounts), // if hideShowAccounts is true, show all accounts by default
        }),
        {},
      ),
    [hdKeyrings],
  );

  const [showAccounts, setShowAccounts] = useState<Record<string, boolean>>(
    showAccountsInitState,
  );

  return (
    <Box padding={4} data-testid="srp-list">
      {hdKeyrings.map((keyring, index) => (
        <Card
          key={`srp-${index + 1}`}
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
              <Text>{`Secret Phrase ${index + 1}`}</Text>
              {!hideShowAccounts && (
                <Text
                  variant={TextVariant.bodySm}
                  color={TextColor.primaryDefault}
                  className="srp-list__show-accounts"
                  onClick={(event: React.MouseEvent) => {
                    event.stopPropagation();
                    setShowAccounts({
                      ...showAccounts,
                      [index]: !showAccounts[index],
                    });
                  }}
                >
                  {showAccounts[index] ? 'Hide' : 'Show'}{' '}
                  {keyring.accounts.length} account
                  {keyring.accounts.length > 1 ? 's' : ''}
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
                return <SRPListItem account={account} />;
              })}
            </Box>
          )}
        </Card>
      ))}
    </Box>
  );
};
