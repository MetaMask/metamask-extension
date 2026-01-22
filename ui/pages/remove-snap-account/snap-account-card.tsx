import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
  BlockSize,
  BorderRadius,
  Display,
  FlexDirection,
  TextVariant,
  TextColor,
  JustifyContent,
  AlignItems,
  TextAlign,
} from '../../helpers/constants/design-system';
import { Box, Text, Tag } from '../../components/component-library';
import { PreferredAvatar } from '../../components/app/preferred-avatar';
import { getSnapName, shortenAddress } from '../../helpers/utils/util';
import { selectAccountGroupNameByInternalAccount } from '../confirmations/selectors/accounts';
import { MultichainAccountsState } from '../../selectors/multichain-accounts/account-tree.types';
import {
  getMetaMaskAccountsOrdered,
  getMetaMaskKeyrings,
  getSnapsMetadata,
  getShouldHideZeroBalanceTokens,
  getIsTokenNetworkFilterEqualCurrentNetwork,
  getShowFiatInTestnets,
  getChainIdsToPoll,
} from '../../selectors';
import {
  getMultichainBalances,
  getMultichainIsTestnet,
  getMultichainNetwork,
  getMultichainShouldShowFiat,
} from '../../selectors/multichain';
import { getMultichainAggregatedBalance } from '../../selectors/assets';
import { MergedInternalAccount } from '../../selectors/selectors.types';
import { KeyringType } from '../../../shared/constants/keyring';
import UserPreferencedCurrencyDisplay from '../../components/app/user-preferenced-currency-display/user-preferenced-currency-display.component';
import { PRIMARY } from '../../helpers/constants/common';
import { AccountNetworkIndicator } from '../../components/multichain/account-network-indicator';
import { MULTICHAIN_NETWORK_TO_ASSET_TYPES } from '../../../shared/constants/multichain/assets';
import { useMultichainSelector } from '../../hooks/useMultichainSelector';
import { useGetFormattedTokensPerChain } from '../../hooks/useGetFormattedTokensPerChain';
import { useAccountTotalCrossChainFiatBalance } from '../../hooks/useAccountTotalCrossChainFiatBalance';
import { getAccountLabels } from '../../helpers/utils/accounts';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { normalizeSafeAddress } from '../../../app/scripts/lib/multichain/address';

const MAXIMUM_CURRENCY_DECIMALS = 3;

// Component to display snap account information (avatar, address, account group name, balance, network indicator, and snap name)
export const SnapAccountCard = ({
  address,
  remove,
}: {
  address: string;
  remove?: boolean;
}) => {
  const accounts = useSelector(getMetaMaskAccountsOrdered);
  const account = accounts.find(
    (internalAccount: { address: string }) =>
      internalAccount.address === address,
  ) as MergedInternalAccount;

  const accountGroupName = useSelector((state: MultichainAccountsState) =>
    selectAccountGroupNameByInternalAccount(state, address),
  );

  const snapMetadata = useSelector(getSnapsMetadata);
  const keyrings = useSelector(getMetaMaskKeyrings);

  const accountLabels = useMemo(
    () =>
      getAccountLabels(
        account.metadata.keyring.type,
        account,
        keyrings,
        account.metadata.keyring.type === KeyringType.snap
          ? getSnapName(snapMetadata)(account.metadata?.snap?.id)
          : null,
      ),
    [account, keyrings, snapMetadata],
  );

  const { isEvmNetwork, chainId: multichainChainId } = useMultichainSelector(
    getMultichainNetwork,
    account,
  );

  const isTestnet = useMultichainSelector(getMultichainIsTestnet, account);
  const isMainnet = !isTestnet;
  const shouldShowFiat = useMultichainSelector(
    getMultichainShouldShowFiat,
    account,
  );
  const showFiatInTestnets = useSelector(getShowFiatInTestnets);
  const showFiat =
    shouldShowFiat && (isMainnet || (isTestnet && showFiatInTestnets));

  const multichainAggregatedBalance = useSelector((state) =>
    getMultichainAggregatedBalance(state, account),
  );

  const multichainBalances = useSelector(getMultichainBalances);
  const accountMultichainBalances = multichainBalances?.[account.id];
  const accountMultichainNativeBalance =
    accountMultichainBalances?.[
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      `${MULTICHAIN_NETWORK_TO_ASSET_TYPES[multichainChainId]}`
    ]?.amount;

  const shouldHideZeroBalanceTokens = useSelector(
    getShouldHideZeroBalanceTokens,
  );
  const isTokenNetworkFilterEqualCurrentNetwork = useSelector(
    getIsTokenNetworkFilterEqualCurrentNetwork,
  );
  const allChainIDs = useSelector(getChainIdsToPoll);
  const { formattedTokensWithBalancesPerChain } = useGetFormattedTokensPerChain(
    account,
    shouldHideZeroBalanceTokens,
    isTokenNetworkFilterEqualCurrentNetwork,
    allChainIDs,
  );
  const { totalFiatBalance } = useAccountTotalCrossChainFiatBalance(
    account,
    formattedTokensWithBalancesPerChain,
  );

  let balanceToTranslate;
  if (isEvmNetwork) {
    balanceToTranslate =
      !shouldShowFiat || isTestnet || !process.env.PORTFOLIO_VIEW
        ? account.balance
        : totalFiatBalance;
  } else {
    balanceToTranslate =
      !shouldShowFiat || isTestnet
        ? accountMultichainNativeBalance
        : multichainAggregatedBalance;
  }

  const getIsAggregatedFiatOverviewBalanceProp = () => {
    const isAggregatedFiatOverviewBalance =
      (!isTestnet && process.env.PORTFOLIO_VIEW && shouldShowFiat) ||
      (!isEvmNetwork && shouldShowFiat);

    return isAggregatedFiatOverviewBalance;
  };

  return (
    <Box
      className={remove ? 'snap-account-card-remove' : 'snap-account-card'}
      borderRadius={BorderRadius.LG}
      marginTop={4}
      marginBottom={4}
      width={BlockSize.Full}
      style={{
        boxShadow: 'var(--shadow-size-lg) var(--color-shadow-default)',
      }}
    >
      <Box display={Display.Flex} padding={4} className="items-center">
        <Box className="flex w-full gap-2 items-center">
          <PreferredAvatar address={address} />

          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Column}
            className="multichain-account-list-item__content"
          >
            <Box display={Display.Flex} flexDirection={FlexDirection.Column}>
              <Box
                display={Display.Flex}
                justifyContent={JustifyContent.spaceBetween}
              >
                <Box
                  className="multichain-account-list-item__account-name"
                  marginInlineEnd={2}
                  display={Display.Flex}
                  alignItems={AlignItems.center}
                  gap={2}
                >
                  <Text
                    variant={TextVariant.bodyMdMedium}
                    className="multichain-account-list-item__account-name__button"
                    ellipsis
                  >
                    {accountGroupName}
                  </Text>
                </Box>
                <Text
                  as="div"
                  className="multichain-account-list-item__asset"
                  display={Display.Flex}
                  flexDirection={FlexDirection.Row}
                  alignItems={AlignItems.center}
                  justifyContent={JustifyContent.flexEnd}
                  ellipsis
                  textAlign={TextAlign.End}
                >
                  <UserPreferencedCurrencyDisplay
                    account={account}
                    ethNumberOfDecimals={MAXIMUM_CURRENCY_DECIMALS}
                    value={balanceToTranslate as string | undefined}
                    type={PRIMARY}
                    showFiat={showFiat}
                    isAggregatedFiatOverviewBalance={getIsAggregatedFiatOverviewBalanceProp()}
                    data-testid="first-currency-display"
                  />
                </Text>
              </Box>
            </Box>
            <Box
              display={Display.Flex}
              justifyContent={JustifyContent.spaceBetween}
            >
              <Box display={Display.Flex} alignItems={AlignItems.center}>
                <Text
                  variant={TextVariant.bodySm}
                  color={TextColor.textAlternative}
                  data-testid="account-list-address"
                >
                  {shortenAddress(normalizeSafeAddress(address))}
                </Text>
              </Box>
              <Box className="network-indicator">
                <AccountNetworkIndicator scopes={account.scopes} />
              </Box>
            </Box>
            {accountLabels.length > 0 ? (
              <Box flexDirection={FlexDirection.Row}>
                {accountLabels.map(({ label, icon }) => {
                  return (
                    <Tag
                      data-testid={`account-list-item-tag-${account.id}-${label}`}
                      key={label}
                      label={label}
                      labelProps={{
                        variant: TextVariant.bodyXs,
                        color: TextColor.textAlternative,
                      }}
                      startIconName={icon ?? undefined}
                    />
                  );
                })}
              </Box>
            ) : null}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
