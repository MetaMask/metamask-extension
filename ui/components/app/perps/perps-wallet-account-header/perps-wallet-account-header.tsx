import React, { useMemo } from 'react';
import type { Hex } from '@metamask/utils';
import {
  AvatarNetwork,
  AvatarNetworkSize,
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
  FontWeight,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { useSelector } from 'react-redux';
import {
  CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP,
  NETWORK_TO_NAME_MAP,
} from '../../../../../shared/constants/network';
import { PreferredAvatar } from '../../preferred-avatar';
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

  const networkBackgroundKey = getAvatarNetworkColor(networkDisplayName);
  const networkAvatarStyle = networkBackgroundKey
    ? {
        backgroundColor: `var(--color-network-${networkBackgroundKey}-default)`,
      }
    : undefined;

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
      flexDirection={BoxFlexDirection.Row}
      className="confirm_header__wrapper"
      alignItems={BoxAlignItems.Center}
      justifyContent={BoxJustifyContent.Between}
      data-testid="perps-wallet-account-header"
    >
      <Box
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.Start}
        padding={4}
      >
        <Box flexDirection={BoxFlexDirection.Row} marginTop={2}>
          <PreferredAvatar address={senderAddress} />
          {isMultichainAccountsState2Enabled ? null : (
            <AvatarNetwork
              src={networkImageUrl}
              name={networkDisplayName}
              size={AvatarNetworkSize.Xs}
              className="confirm_header__avatar-network"
              style={networkAvatarStyle}
            />
          )}
        </Box>
        <Box
          flexDirection={BoxFlexDirection.Column}
          alignItems={BoxAlignItems.Start}
          gap={1}
          marginLeft={4}
          marginTop={secondaryText ? 0 : 3}
        >
          <Text
            color={TextColor.TextDefault}
            variant={TextVariant.BodyMd}
            fontWeight={FontWeight.Medium}
            data-testid="perps-wallet-account-header-name"
          >
            {primaryLabel}
          </Text>
          {secondaryText ? (
            <Text
              color={TextColor.TextAlternative}
              variant={TextVariant.BodyMd}
              data-testid="perps-wallet-account-header-secondary"
            >
              {secondaryText}
            </Text>
          ) : null}
        </Box>
      </Box>
      {/* Right column reserved to match confirmations header grid; deposit shows HeaderInfo here. */}
      <Box
        alignItems={BoxAlignItems.End}
        flexDirection={BoxFlexDirection.Row}
        padding={4}
      />
    </Box>
  );
};
