import React, { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  KeyringObject,
  KeyringMetadata,
  KeyringTypes,
} from '@metamask/keyring-controller';
import { EthKeyring, InternalAccount } from '@metamask/keyring-internal-api';
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
import {
  getMetaMaskCachedBalances,
  getMetaMaskKeyrings,
} from '../../../../selectors/selectors';
import { getInternalAccounts } from '../../../../selectors/accounts';
import UserPreferencedCurrencyDisplay from '../../../app/user-preferenced-currency-display/user-preferenced-currency-display.component';
import { shortenAddress } from '../../../../helpers/utils/util';
import { Numeric } from '../../../../../shared/modules/Numeric';
import { EtherDenomination } from '../../../../../shared/constants/common';
import { useMultichainSelector } from '../../../../hooks/useMultichainSelector';
import { getMultichainConversionRate } from '../../../../selectors/multichain';

export const SRPList = ({
  onActionComplete,
  hideShowAccounts,
}: {
  onActionComplete: (id: string) => void;
  hideShowAccounts?: boolean;
}) => {
  const keyrings: (EthKeyring<Json> & {
    accounts: string[];
    metadata: KeyringMetadata;
  })[] = useSelector(getMetaMaskKeyrings);
  const accounts: InternalAccount[] = useSelector(getInternalAccounts);
  const accountBalances: Record<string, string> = useSelector(
    getMetaMaskCachedBalances,
  );
  const conversionRate = useMultichainSelector(getMultichainConversionRate);

  const accountByAddress: Record<string, InternalAccount> = useMemo(
    () =>
      accounts.reduce(
        (acc: Record<string, InternalAccount>, account: InternalAccount) => ({
          ...acc,
          [account.address]: account,
        }),
        {},
      ),
    [accounts],
  );
  const hdKeyrings = useMemo(
    () => keyrings.filter((keyring) => keyring.type === KeyringTypes.hd),
    [keyrings],
  );

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
    <Box padding={4}>
      {hdKeyrings.map((keyring, index) => (
        <Card
          onClick={() =>
            onActionComplete(
              (keyring as KeyringObject & { metadata: KeyringMetadata })
                .metadata.id,
            )
          }
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
              <Text>Secret Phrase {index + 1}</Text>
              {!hideShowAccounts && (
                <Text
                  variant={TextVariant.bodySm}
                  color={TextColor.primaryDefault}
                  className="srp-list__show-accounts"
                  onClick={(e) => {
                    e.stopPropagation();
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
              {keyring.accounts.map((address: string) => (
                <Box
                  display={Display.Flex}
                  flexDirection={FlexDirection.Row}
                  alignItems={AlignItems.center}
                  justifyContent={JustifyContent.spaceBetween}
                >
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
                      className="srp-list__account-name"
                      variant={TextVariant.bodySm}
                      paddingLeft={3}
                    >
                      {accountByAddress[address].metadata.name}
                    </Text>
                    <Text
                      variant={TextVariant.bodySm}
                      color={TextColor.textAlternative}
                      marginLeft={1}
                    >
                      {shortenAddress(address)}
                    </Text>
                  </Box>
                  <Text variant={TextVariant.bodySm}>
                    <UserPreferencedCurrencyDisplay
                      value={new Numeric(
                        accountBalances[address],
                        16,
                        EtherDenomination.WEI,
                      )
                        .toDenomination(EtherDenomination.ETH)
                        .toBase(10)
                        .times(new Numeric(conversionRate, 10))
                        .toString()}
                      type="PRIMARY"
                      ethNumberOfDecimals={4}
                      hideTitle
                      showFiat
                      isAggregatedFiatOverviewBalance
                      hideLabel
                    />
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
