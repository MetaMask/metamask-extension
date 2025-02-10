import React from 'react';
import classnames from 'classnames';
import { useSelector } from 'react-redux';
import { getSnapName, shortenAddress } from '../../../helpers/utils/util';

import {
  AvatarAccount,
  AvatarAccountSize,
  AvatarAccountVariant,
  Box,
  Text,
  AvatarToken,
  AvatarTokenSize,
} from '../../component-library';

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
} from '../../../helpers/constants/design-system';

import { KeyringType } from '../../../../shared/constants/keyring';
import {
  getUseBlockie,
  getSnapsMetadata,
  getShouldHideZeroBalanceTokens,
  getIsTokenNetworkFilterEqualCurrentNetwork,
  getChainIdsToPoll,
} from '../../../selectors';
// eslint-disable-next-line import/no-restricted-paths
import { normalizeSafeAddress } from '../../../../app/scripts/lib/multichain/address';
import { getAccountLabel } from '../../../helpers/utils/accounts';
import { useMultichainAccountTotalFiatBalance } from '../../../hooks/useMultichainAccountTotalFiatBalance';
import { useGetFormattedTokensPerChain } from '../../../hooks/useGetFormattedTokensPerChain';
import { useAccountTotalCrossChainFiatBalance } from '../../../hooks/useAccountTotalCrossChainFiatBalance';
import { AvatarGroup } from '../avatar-group';
import UserPreferencedCurrencyDisplay from '../../app/user-preferenced-currency-display/user-preferenced-currency-display.component';
import { PRIMARY, SECONDARY } from '../../../helpers/constants/common';
import { useMultichainSelector } from '../../../hooks/useMultichainSelector';
import {
  getMultichainNetwork,
  getMultichainIsTestnet,
  getMultichainShouldShowFiat,
  getMultichainNativeCurrency,
  getMultichainNativeCurrencyImage,
} from '../../../selectors/multichain';
import { getShowFiatInTestnets } from '../../../selectors';

const MAXIMUM_CURRENCY_DECIMALS = 3;

interface DestinationAccountListItemProps {
  account: {
    type:
      | 'eip155:eoa'
      | 'eip155:erc4337'
      | 'bip122:p2wpkh'
      | 'solana:data-account';
    id: string;
    address: string;
    balance: string;
    metadata: {
      name: string;
      importTime: number;
      keyring: {
        type: string;
      };
      snap?: {
        id: string;
        name?: string;
        enabled?: boolean;
      };
    };
    options: Record<string, any>;
    methods: string[];
    scopes: string[];
  };
  selected: boolean;
  onClick?: () => void;
}

const DestinationAccountListItem: React.FC<DestinationAccountListItemProps> = ({
  account,
  selected,
  onClick,
}) => {
  const snapMetadata = useSelector(getSnapsMetadata);
  const accountLabel = getAccountLabel(
    account.metadata.keyring.type,
    account,
    account.metadata.keyring.type === KeyringType.snap
      ? getSnapName(snapMetadata)(account.metadata?.snap?.id)
      : null,
  );

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
      !shouldShowFiat || isTestnet || !process.env.PORTFOLIO_VIEW
        ? account.balance
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
        >
          <Text variant={TextVariant.bodyMdMedium}>
            {account.metadata.name}
          </Text>
          <Box
            display={Display.Flex}
            alignItems={AlignItems.center}
            justifyContent={JustifyContent.flexEnd}
            gap={1}
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
              ellipsis
              textAlign={TextAlign.End}
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
