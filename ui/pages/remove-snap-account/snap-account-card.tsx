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
import {
  Box,
  Text,
  Tag,
  SensitiveText,
} from '../../components/component-library';
import { Skeleton } from '../../components/component-library/skeleton';
import { PreferredAvatar } from '../../components/app/preferred-avatar';
import { getSnapName, shortenAddress } from '../../helpers/utils/util';
import { selectAccountGroupNameByInternalAccount } from '../confirmations/selectors/accounts';
import { MultichainAccountsState } from '../../selectors/multichain-accounts/account-tree.types';
import { getAccountGroupsByAddress } from '../../selectors/multichain-accounts/account-tree';
import { selectBalanceByAccountGroup } from '../../selectors/assets';
import {
  getMetaMaskAccountsOrdered,
  getMetaMaskKeyrings,
  getSnapsMetadata,
  getPreferences,
} from '../../selectors';
import { MergedInternalAccount } from '../../selectors/selectors.types';
import { KeyringType } from '../../../shared/constants/keyring';
import { AccountNetworkIndicator } from '../../components/multichain/account-network-indicator';
import { getAccountLabels } from '../../helpers/utils/accounts';
import { useFormatters } from '../../hooks/useFormatters';
import { getCurrentCurrency } from '../../ducks/metamask/metamask';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { normalizeSafeAddress } from '../../../app/scripts/lib/multichain/address';

// Component to display snap account information (avatar, address, account group name, balance, network indicator, and snap name)
export const SnapAccountCard = ({
  address,
  remove,
}: {
  address: string;
  remove?: boolean;
}) => {
  const accounts: MergedInternalAccount[] = useSelector(
    getMetaMaskAccountsOrdered,
  );
  const account = accounts.find(
    (internalAccount) =>
      normalizeSafeAddress(internalAccount.address) ===
      normalizeSafeAddress(address),
  ) as MergedInternalAccount;

  const accountGroupName = useSelector((state: MultichainAccountsState) =>
    selectAccountGroupNameByInternalAccount(state, address),
  );

  // Get the account group ID for this new account and its balance.
  const accountGroups = useSelector((state: MultichainAccountsState) =>
    getAccountGroupsByAddress(state, [address]),
  );
  const accountGroupId = accountGroups[0]?.id;
  const accountGroupBalance = useSelector((state) =>
    accountGroupId ? selectBalanceByAccountGroup(accountGroupId)(state) : null,
  );

  // Get account group labels (e.g., Snap name) for display.
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

  // Format the balance using the account group's aggregated balance.
  const { privacyMode } = useSelector(getPreferences);
  const fallbackCurrency = useSelector(getCurrentCurrency);
  const { formatCurrency } = useFormatters();

  const total = accountGroupBalance?.totalBalanceInUserCurrency;
  const currency = accountGroupBalance?.userCurrency ?? fallbackCurrency;
  const isBalanceLoading = total === undefined || currency === undefined;
  const formattedBalance = isBalanceLoading
    ? null
    : formatCurrency(total, currency);

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
                <Skeleton isLoading={isBalanceLoading}>
                  <SensitiveText
                    className="multichain-account-list-item__asset"
                    variant={TextVariant.bodyMdMedium}
                    isHidden={privacyMode}
                    data-testid="account-balance"
                    textAlign={TextAlign.End}
                    ellipsis
                  >
                    {formattedBalance}
                  </SensitiveText>
                </Skeleton>
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
