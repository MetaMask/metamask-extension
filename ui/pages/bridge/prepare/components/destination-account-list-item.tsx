import React from 'react';
import classnames from 'classnames';
import { useSelector } from 'react-redux';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { shortenAddress } from '../../../../helpers/utils/util';

import {
  AvatarAccount,
  AvatarAccountSize,
  AvatarAccountVariant,
  Box,
  Text,
  AvatarToken,
  AvatarTokenSize,
} from '../../../../components/component-library';

import {
  AlignItems,
  BackgroundColor,
  BorderColor,
  Display,
  TextColor,
  TextVariant,
  JustifyContent,
  TextAlign,
  FlexDirection,
} from '../../../../helpers/constants/design-system';

import {
  getUseBlockie,
  getShouldHideZeroBalanceTokens,
  getIsTokenNetworkFilterEqualCurrentNetwork,
  getChainIdsToPoll,
  getShowFiatInTestnets,
} from '../../../../selectors';
// eslint-disable-next-line import/no-restricted-paths
import { normalizeSafeAddress } from '../../../../../app/scripts/lib/multichain/address';
import { useMultichainAccountTotalFiatBalance } from '../../../../hooks/useMultichainAccountTotalFiatBalance';
import { useGetFormattedTokensPerChain } from '../../../../hooks/useGetFormattedTokensPerChain';
import { useAccountTotalCrossChainFiatBalance } from '../../../../hooks/useAccountTotalCrossChainFiatBalance';
import UserPreferencedCurrencyDisplay from '../../../../components/app/user-preferenced-currency-display/user-preferenced-currency-display.component';
import { PRIMARY } from '../../../../helpers/constants/common';
import { useMultichainSelector } from '../../../../hooks/useMultichainSelector';
import {
  getMultichainNetwork,
  getMultichainIsTestnet,
  getMultichainShouldShowFiat,
  getMultichainNativeCurrency,
  getMultichainNativeCurrencyImage,
} from '../../../../selectors/multichain';

const MAXIMUM_CURRENCY_DECIMALS = 3;

type DestinationAccountListItemProps = {
  account: InternalAccount;
  selected: boolean;
  onClick?: () => void;
};

const DestinationAccountListItem: React.FC<DestinationAccountListItemProps> = ({
  account,
  selected,
  onClick,
}) => {
  const useBlockie = useSelector(getUseBlockie);
  const shouldHideZeroBalanceTokens = useSelector(
    getShouldHideZeroBalanceTokens,
  );
  const isTokenNetworkFilterEqualCurrentNetwork = useSelector(
    getIsTokenNetworkFilterEqualCurrentNetwork,
  );
  const allChainIDs = useSelector(getChainIdsToPoll);

  const { isEvmNetwork } = useMultichainSelector(getMultichainNetwork, account);
  const isTestnet = useMultichainSelector(getMultichainIsTestnet, account);
  const isMainnet = !isTestnet;
  const shouldShowFiat = useMultichainSelector(
    getMultichainShouldShowFiat,
    account,
  );
  const showFiatInTestnets = useSelector(getShowFiatInTestnets);
  const showFiat =
    shouldShowFiat && (isMainnet || (isTestnet && showFiatInTestnets));

  const primaryTokenImage = useMultichainSelector(
    getMultichainNativeCurrencyImage,
    account,
  );
  const nativeCurrency = useMultichainSelector(
    getMultichainNativeCurrency,
    account,
  );

  const accountTotalFiatBalances =
    useMultichainAccountTotalFiatBalance(account);

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

  // TODO: not working - troubleshoot.
  // const chainAvatars = Object.values(formattedTokensWithBalancesPerChain).map(
  //   (chainData) => ({
  //     avatarValue: chainData.networkImage,
  //   }),
  // );

  let balanceToTranslate;
  if (isEvmNetwork) {
    balanceToTranslate =
      !shouldShowFiat || isTestnet
        ? // @ts-expect-error: balance is not typed.
          account.balance
        : totalFiatBalance;
  } else {
    balanceToTranslate = accountTotalFiatBalances.totalBalance;
  }

  return (
    <Box
      display={Display.Flex}
      padding={4}
      backgroundColor={
        selected ? BackgroundColor.primaryMuted : BackgroundColor.transparent
      }
      className={classnames('multichain-account-list-item', {
        'multichain-account-list-item--selected': selected,
      })}
      onClick={onClick}
      alignItems={AlignItems.center}
    >
      <AvatarAccount
        borderColor={BorderColor.transparent}
        size={AvatarAccountSize.Md}
        address={account.address}
        variant={
          useBlockie
            ? AvatarAccountVariant.Blockies
            : AvatarAccountVariant.Jazzicon
        }
        marginInlineEnd={2}
      />

      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        style={{ flex: 1 }}
      >
        <Box
          display={Display.Flex}
          justifyContent={JustifyContent.spaceBetween}
          gap={2}
          style={{ width: '100%' }}
        >
          <Box
            display={Display.Flex}
            alignItems={AlignItems.center}
            style={{ minWidth: 0, flex: '1 1 auto', overflow: 'hidden' }}
          >
            <Text
              variant={TextVariant.bodyMdMedium}
              ellipsis
              style={{ maxWidth: '200px' }}
            >
              {account.metadata.name}
              {/* // TODO Swaps: This needs to be updated to the new account group name */}
            </Text>
          </Box>
          <Box
            display={Display.Flex}
            alignItems={AlignItems.center}
            justifyContent={JustifyContent.flexEnd}
            gap={1}
            style={{ minWidth: 'fit-content', flexShrink: 0 }}
          >
            {/* <AvatarToken
              src={primaryTokenImage}
              name={nativeCurrency}
              size={AvatarTokenSize.Xs}
              borderColor={BorderColor.borderDefault}
            /> */}
            <Text
              as="div"
              display={Display.Flex}
              flexDirection={FlexDirection.Row}
              alignItems={AlignItems.center}
              justifyContent={JustifyContent.flexEnd}
              textAlign={TextAlign.End}
              style={{ whiteSpace: 'nowrap' }}
            >
              <UserPreferencedCurrencyDisplay
                ethNumberOfDecimals={MAXIMUM_CURRENCY_DECIMALS}
                value={balanceToTranslate}
                type={PRIMARY}
                showFiat={showFiat}
                isAggregatedFiatOverviewBalance={showFiat}
                hideLabel={true}
                data-testid="first-currency-display"
              />
            </Text>
          </Box>
        </Box>

        <Box
          display={Display.Flex}
          justifyContent={JustifyContent.spaceBetween}
          alignItems={AlignItems.center}
        >
          <Text
            variant={TextVariant.bodySm}
            color={TextColor.textAlternative}
            data-testid="account-list-address"
          >
            {shortenAddress(normalizeSafeAddress(account.address))}
          </Text>
          <Box display={Display.Flex} gap={2}>
            {/* // TODO: not working - troubleshoot. */}
            {/* {chainAvatars.length > 0 && (
              <AvatarGroup members={chainAvatars} limit={4} />
            )} */}
            <AvatarToken
              src={primaryTokenImage}
              name={nativeCurrency}
              size={AvatarTokenSize.Xs}
              borderColor={BorderColor.borderDefault}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default React.memo(DestinationAccountListItem);
