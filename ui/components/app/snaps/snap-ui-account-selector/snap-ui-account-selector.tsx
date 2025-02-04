import { Caip2ChainId } from '@metamask/snaps-utils';
import React, { FunctionComponent } from 'react';
import { useSelector } from 'react-redux';
import {
  CaipAccountId,
  CaipChainId,
  CaipNamespace,
  isCaipNamespace,
  KnownCaipNamespace,
  parseCaipChainId,
} from '@metamask/utils';
import { InternalAccount } from '@metamask/keyring-internal-api';

import { AccountSelectorValue, State } from '@metamask/snaps-sdk';
import { SnapUISelector } from '../snap-ui-selector';
import {
  getInternalAccounts,
  getShowFiatInTestnets,
  getUseBlockie,
} from '../../../../selectors';

import { TEST_NETWORK_IDS } from '../../../../../shared/constants/network';
import { MultichainNetworks } from '../../../../../shared/constants/multichain/networks';
import {
  AlignItems,
  BlockSize,
  BorderColor,
  Display,
  FlexDirection,
  TextAlign,
  TextColor,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import {
  AvatarAccount,
  AvatarAccountSize,
  AvatarAccountVariant,
  AvatarToken,
  AvatarTokenSize,
  Box,
  Text,
} from '../../../component-library';
import { shortenAddress } from '../../../../helpers/utils/util';
import { normalizeSafeAddress } from '../../../../../app/scripts/lib/multichain/address';
import UserPreferencedCurrencyDisplay from '../../user-preferenced-currency-display/user-preferenced-currency-display.component';
import { PRIMARY } from '../../../../helpers/constants/common';
import { useMultichainAccountBalances } from '../../../../hooks/snaps/useMultichainTotalCrossChainFiatBalance';
import { AvatarGroup } from '../../../multichain';

function createAddressList(
  address: string,
  scopes: (CaipChainId | CaipNamespace)[],
): CaipAccountId[] {
  return scopes.map((scope) => {
    // Waiting for https://github.com/MetaMask/utils/pull/227
    if (isCaipNamespace(scope)) {
      // We safely assume that is we only have a namespace, it is eip155
      return `${scope}:1:${address}` as CaipAccountId;
    }

    return `${scope as string}:${address}` as CaipAccountId;
  });
}

export type SnapUIAccountSelectorOptionProps = {
  account: InternalAccount;
  chainIds?: Caip2ChainId[];
};

export const SnapUIAccountSelectorOption: FunctionComponent<
  SnapUIAccountSelectorOptionProps
> = ({ account, chainIds }) => {
  const useBlockie = useSelector(getUseBlockie);
  const showFiatInTestnets = useSelector(getShowFiatInTestnets);

  const { totalFiatBalance, assets } = useMultichainAccountBalances(
    account,
    chainIds,
  );

  const assetsAvatars = assets.map((asset) => ({ avatarValue: asset.iconUrl }));

  const isOnlyMainnet = assets.every((asset) => {
    const { chainId } = asset;
    const { namespace, reference } = parseCaipChainId(chainId);
    if (namespace === KnownCaipNamespace.Eip155) {
      return !(TEST_NETWORK_IDS as string[]).includes(
        parseInt(reference, 16).toString(),
      );
    }

    return (
      chainId !== MultichainNetworks.BITCOIN_TESTNET &&
      chainId !== MultichainNetworks.SOLANA_TESTNET &&
      chainId !== MultichainNetworks.SOLANA_DEVNET
    );
  });

  const shouldShowFiat =
    isOnlyMainnet || (!isOnlyMainnet && showFiatInTestnets);

  const amountToDisplay = shouldShowFiat
    ? totalFiatBalance
    : assets[0].string ?? '0';

  return (
    <Box
      display={Display.Flex}
      width={BlockSize.Full}
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
        width={BlockSize.Full}
      >
        <Text variant={TextVariant.bodyMdMedium} ellipsis>
          {account.metadata.name}
        </Text>
        <Text variant={TextVariant.bodySm} color={TextColor.textAlternative}>
          {shortenAddress(normalizeSafeAddress(account.address))}
        </Text>
      </Box>
      <Box display={Display.Flex} flexDirection={FlexDirection.Column}>
        <Box>
          <Text
            variant={TextVariant.bodySm}
            color={TextColor.textAlternative}
            textAlign={TextAlign.End}
          >
            <UserPreferencedCurrencyDisplay
              account={account}
              value={amountToDisplay}
              type={PRIMARY}
              showFiat={shouldShowFiat}
              textProps={{ color: TextColor.textAlternative }}
              ethNumberOfDecimals={3}
              isAggregatedFiatOverviewBalance={true}
              style={{ flexWrap: 'nowrap' }}
            />
          </Text>
        </Box>
        <Box style={{ alignSelf: 'flex-end' }}>
          {assets.length > 1 && (
            <AvatarGroup members={assetsAvatars} limit={3} />
          )}
          {assets.length === 1 && (
            <AvatarToken
              src={assets[0].iconUrl}
              name={assets[0].symbol}
              size={AvatarTokenSize.Xs}
            />
          )}
        </Box>
      </Box>
    </Box>
  );
};

export type SnapUIAccountSelectorProps = {
  name: string;
  label?: string;
  form?: string;
  hideExternalAccounts?: boolean;
  chainIds?: Caip2ChainId[];
  switchSelectedAccount?: boolean;
  error?: string;
  disabled?: boolean;
};

export const SnapUIAccountSelector: FunctionComponent<
  SnapUIAccountSelectorProps
> = ({ chainIds, ...props }) => {
  const accounts = useSelector(getInternalAccounts);

  const options = accounts.map((account) => ({
    accountId: account.id,
    addresses: createAddressList(account.address, account.scopes),
  }));

  const optionComponents = accounts.map((account) => (
    <SnapUIAccountSelectorOption account={account} chainIds={chainIds} />
  ));

  const findSelectedOptionIndex = (selectedOptionValue: State | undefined) =>
    options.findIndex(
      (option) =>
        option.accountId ===
        (selectedOptionValue as AccountSelectorValue).accountId,
    );

  return (
    <SnapUISelector
      title={'Select account'}
      options={options}
      {...props}
      optionComponents={optionComponents}
      findSelectedOptionIndex={findSelectedOptionIndex}
    />
  );
};
