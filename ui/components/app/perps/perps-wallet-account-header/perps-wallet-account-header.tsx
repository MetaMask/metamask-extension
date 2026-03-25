import type { Hex } from '@metamask/utils';
import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
  CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP,
  NETWORK_TO_NAME_MAP,
} from '../../../../../shared/constants/network';
import {
  AvatarNetwork,
  AvatarNetworkSize,
  Box,
  Text,
} from '../../../component-library';
import { PreferredAvatar } from '../../preferred-avatar';
import {
  AlignItems,
  Display,
  FlexDirection,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import { getAvatarNetworkColor } from '../../../../helpers/utils/accounts';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { getCurrentChainId } from '../../../../../shared/lib/selectors/networks';
import {
  getIsMultichainAccountsState2Enabled,
  selectNetworkConfigurationByChainId,
} from '../../../../selectors';
import { getSelectedInternalAccount } from '../../../../selectors/accounts';
import { selectAccountGroupNameByAddress } from '../../../../selectors/multichain-accounts/account-tree';
import type { MultichainAccountsState } from '../../../../selectors/multichain-accounts/account-tree.types';

/**
 * Tab-safe wallet name for subtitle (matches confirmations header intent without
 * `getWalletsWithAccounts`, which depends on active tab origin).
 *
 * @param state - Redux root state.
 * @param address - Selected account address.
 */
function getWalletMetadataNameByAddress(
  state: unknown,
  address: string,
): string | undefined {
  const { metamask } = state as MultichainAccountsState;
  const internalAccountsObject = metamask.internalAccounts.accounts;
  const { wallets } = metamask.accountTree;

  for (const wallet of Object.values(wallets)) {
    for (const group of Object.values(wallet.groups)) {
      for (const accountId of group.accounts) {
        const acc = internalAccountsObject[accountId];
        if (acc?.address.toLowerCase() === address.toLowerCase()) {
          return wallet.metadata.name;
        }
      }
    }
  }

  return undefined;
}

/**
 * @param state - Redux root state.
 */
function getHasMultipleWallets(state: unknown): boolean {
  const { metamask } = state as MultichainAccountsState;
  return Object.keys(metamask.accountTree.wallets).length > 1;
}

/**
 * Account strip matching confirmations `Header` default layout (sender avatar,
 * network badge, account name, secondary line) for standalone Perps pages.
 */
export const PerpsWalletAccountHeader: React.FC = () => {
  const t = useI18nContext();
  const selectedAccount = useSelector(getSelectedInternalAccount);
  const senderAddress = selectedAccount?.address ?? '';
  const isMultichainAccountsState2Enabled = useSelector(
    getIsMultichainAccountsState2Enabled,
  );
  const chainId = useSelector(getCurrentChainId) as Hex;

  const accountGroupDisplayName = useSelector((state) =>
    selectAccountGroupNameByAddress(state, senderAddress),
  );

  const walletNameForSubtitle = useSelector((state) =>
    senderAddress
      ? getWalletMetadataNameByAddress(state, senderAddress)
      : undefined,
  );

  const hasMoreThanOneWallet = useSelector(getHasMultipleWallets);

  const networkConfiguration = useSelector((state) =>
    selectNetworkConfigurationByChainId(state, chainId),
  );

  const networkDisplayName = useMemo(() => {
    return (
      networkConfiguration?.name ??
      NETWORK_TO_NAME_MAP[chainId as keyof typeof NETWORK_TO_NAME_MAP] ??
      t('privateNetwork')
    );
  }, [chainId, networkConfiguration?.name, t]);

  const networkImageUrl =
    CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[
      chainId as keyof typeof CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP
    ] ?? '';

  const primaryLabel =
    (isMultichainAccountsState2Enabled ? accountGroupDisplayName : null) ??
    selectedAccount?.metadata?.name ??
    '';

  let secondaryText: string | undefined;
  if (isMultichainAccountsState2Enabled) {
    if (hasMoreThanOneWallet) {
      secondaryText = walletNameForSubtitle ?? '';
    }
  } else {
    secondaryText = networkDisplayName;
  }

  if (!senderAddress || (!primaryLabel && !secondaryText)) {
    return null;
  }

  return (
    <Box
      display={Display.Flex}
      className="confirm_header__wrapper"
      alignItems={AlignItems.center}
      justifyContent={JustifyContent.spaceBetween}
      data-testid="perps-wallet-account-header"
    >
      <Box alignItems={AlignItems.flexStart} display={Display.Flex} padding={4}>
        <Box display={Display.Flex} marginTop={2}>
          <PreferredAvatar address={senderAddress} />
          {isMultichainAccountsState2Enabled ? null : (
            <AvatarNetwork
              src={networkImageUrl}
              name={networkDisplayName}
              size={AvatarNetworkSize.Xs}
              backgroundColor={getAvatarNetworkColor(networkDisplayName)}
              className="confirm_header__avatar-network"
            />
          )}
        </Box>
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          alignItems={AlignItems.flexStart}
          gap={1}
          marginInlineStart={4}
          marginTop={secondaryText ? 0 : 3}
        >
          <Text
            color={TextColor.textDefault}
            variant={TextVariant.bodyMdMedium}
            data-testid="perps-wallet-account-header-name"
          >
            {primaryLabel}
          </Text>
          {secondaryText ? (
            <Text
              color={TextColor.textAlternative}
              data-testid="perps-wallet-account-header-secondary"
            >
              {secondaryText}
            </Text>
          ) : null}
        </Box>
      </Box>
      {/* Right column reserved to match confirmations header grid; deposit shows HeaderInfo here. */}
      <Box alignItems={AlignItems.flexEnd} display={Display.Flex} padding={4} />
    </Box>
  );
};
