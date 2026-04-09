import React from 'react';
import {
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
import { PreferredAvatar } from '../../preferred-avatar';
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
 * Account strip for standalone Perps pages (avatar, account name, optional wallet subtitle).
 */
export const PerpsWalletAccountHeader: React.FC = () => {
  const selectedAccount = useSelector(getSelectedInternalAccount);
  const senderAddress = selectedAccount?.address ?? '';

  const accountGroupDisplayName = useSelector((state) =>
    selectAccountGroupNameByAddress(state, senderAddress),
  );

  const walletNameForSubtitle = useSelector((state) =>
    senderAddress
      ? getWalletMetadataNameByAddress(state, senderAddress)
      : undefined,
  );

  const hasMoreThanOneWallet = useSelector(getHasMultipleWallets);

  const primaryLabel =
    accountGroupDisplayName ?? selectedAccount?.metadata?.name ?? '';

  let secondaryText: string | undefined;
  if (hasMoreThanOneWallet) {
    secondaryText = walletNameForSubtitle ?? '';
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
