import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Tooltip } from 'react-tippy';
import {
  AvatarAccount,
  AvatarAccountSize,
  AvatarAccountVariant,
  AvatarNetwork,
  AvatarNetworkSize,
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  FontWeight,
  Text,
  TextAlign,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP } from '../../../../../shared/constants/network';
import {
  AccountGroupWithInternalAccounts,
  MultichainAccountsState,
} from '../../../../selectors/multichain-accounts/account-tree.types';
import { EvmAndMultichainNetworkConfigurationsWithCaipChainId } from '../../../../selectors/selectors.types';
import {
  MultichainAvatarGroup,
  MultichainAvatarGroupType,
} from '../avatar-group/multichain-avatar-group';
import { getIconSeedAddressesByAccountGroups } from '../../../../selectors/multichain-accounts/account-tree';
import { getAvatarType } from '../../../app/preferred-avatar/preferred-avatar';

export type MultichainSiteCellTooltipProps = {
  accountGroups?: AccountGroupWithInternalAccounts[];
  networks?: EvmAndMultichainNetworkConfigurationsWithCaipChainId[];
};

const TOOLTIP_LIMIT = 4;
const AVATAR_GROUP_LIMIT = 4;

type TooltipContentProps = {
  accountGroups?: AccountGroupWithInternalAccounts[];
  networks?: EvmAndMultichainNetworkConfigurationsWithCaipChainId[];
  moreAccountsText?: string;
  moreNetworksText?: string;
  avatarAccountVariant?: AvatarAccountVariant;
  seedAddresses?: Record<string, string>;
};

const TooltipContent = React.memo<TooltipContentProps>(
  ({
    accountGroups,
    networks,
    moreAccountsText,
    moreNetworksText,
    avatarAccountVariant,
    seedAddresses,
  }) => {
    const displayAccountGroups = accountGroups?.slice(0, TOOLTIP_LIMIT) ?? [];
    const displayNetworks = networks?.slice(0, TOOLTIP_LIMIT) ?? [];
    const hasMoreAccounts =
      accountGroups && accountGroups.length > TOOLTIP_LIMIT;
    const hasMoreNetworks = networks && networks.length > TOOLTIP_LIMIT;

    return (
      <Box
        flexDirection={BoxFlexDirection.Column}
        data-test-id="site-cell-tooltip"
      >
        <Box flexDirection={BoxFlexDirection.Column}>
          {displayAccountGroups.map((acc) => (
            <Box
              flexDirection={BoxFlexDirection.Row}
              alignItems={BoxAlignItems.Center}
              key={acc.id}
              padding={1}
              paddingHorizontal={2}
              gap={2}
            >
              <AvatarAccount
                size={AvatarAccountSize.Xs}
                address={seedAddresses?.[acc.id] ?? ''}
                variant={avatarAccountVariant}
              />
              <Text
                color={TextColor.OverlayInverse}
                variant={TextVariant.BodyMd}
                fontWeight={FontWeight.Medium}
                data-testid="accounts-list-item-connected-account-name"
                textAlign={TextAlign.Left}
                ellipsis
              >
                {acc.metadata.name}
              </Text>
            </Box>
          ))}
          {displayNetworks.map((network) => (
            <Box
              flexDirection={BoxFlexDirection.Row}
              alignItems={BoxAlignItems.Center}
              key={network.chainId}
              padding={1}
              paddingHorizontal={2}
              gap={2}
            >
              <AvatarNetwork
                size={AvatarNetworkSize.Xs}
                src={CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[network.chainId]}
                name={network.name}
                className="border-0"
              />
              <Text
                color={TextColor.OverlayInverse}
                variant={TextVariant.BodyMd}
                fontWeight={FontWeight.Medium}
                data-testid="accounts-list-item-connected-account-name"
                textAlign={TextAlign.Left}
                ellipsis
              >
                {network.name}
              </Text>
            </Box>
          ))}
          {accountGroups &&
            Array.isArray(accountGroups) &&
            hasMoreAccounts &&
            moreAccountsText && (
              <Box
                flexDirection={BoxFlexDirection.Row}
                alignItems={BoxAlignItems.Center}
                paddingHorizontal={2}
              >
                <Text
                  color={TextColor.TextMuted}
                  variant={TextVariant.BodyMd}
                  fontWeight={FontWeight.Medium}
                  data-testid="accounts-list-item-plus-more-tooltip"
                  textAlign={TextAlign.Left}
                >
                  {moreAccountsText}
                </Text>
              </Box>
            )}
          {networks &&
            Array.isArray(networks) &&
            hasMoreNetworks &&
            moreNetworksText && (
              <Box
                flexDirection={BoxFlexDirection.Row}
                alignItems={BoxAlignItems.Center}
                paddingHorizontal={2}
              >
                <Text
                  color={TextColor.TextMuted}
                  variant={TextVariant.BodyMd}
                  fontWeight={FontWeight.Medium}
                  data-testid="networks-list-item-plus-more-tooltip"
                  textAlign={TextAlign.Left}
                >
                  {moreNetworksText}
                </Text>
              </Box>
            )}
        </Box>
      </Box>
    );
  },
);

TooltipContent.displayName = 'TooltipContent';

export const MultichainSiteCellTooltip =
  React.memo<MultichainSiteCellTooltipProps>(({ accountGroups, networks }) => {
    const t = useI18nContext();
    const avatarAccountVariant = useSelector(getAvatarType);

    const seedAddresses = useSelector((state: MultichainAccountsState) =>
      getIconSeedAddressesByAccountGroups(state, accountGroups ?? []),
    );

    const avatarAccountsData = useMemo(() => {
      return (
        accountGroups
          ?.map((accountGroup) => {
            const avatarValue = seedAddresses[accountGroup.id];
            return avatarValue ? { avatarValue } : null;
          })
          .filter((item): item is { avatarValue: string } => item !== null) ??
        []
      );
    }, [accountGroups, seedAddresses]);

    const avatarNetworksData = useMemo(
      () =>
        networks?.map((network) => ({
          avatarValue: CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[network.chainId],
          symbol: network.name,
        })) ?? [],
      [networks],
    );

    const hasAccountGroups =
      Array.isArray(accountGroups) && accountGroups.length > 0;
    const hasNetworks =
      Array.isArray(avatarNetworksData) && avatarNetworksData.length > 0;

    const moreAccountsText = useMemo(() => {
      const hasMoreAccounts =
        accountGroups && accountGroups.length > TOOLTIP_LIMIT;

      if (hasMoreAccounts && accountGroups) {
        return t('moreAccounts', [accountGroups.length - TOOLTIP_LIMIT]);
      }
      return undefined;
    }, [accountGroups, t]);

    const moreNetworksText = useMemo(() => {
      const hasMoreNetworks = networks && networks.length > TOOLTIP_LIMIT;

      if (hasMoreNetworks && networks) {
        return t('moreNetworks', [networks.length - TOOLTIP_LIMIT]);
      }
      return undefined;
    }, [networks, t]);

    return (
      <Tooltip
        position="bottom"
        html={
          <TooltipContent
            accountGroups={accountGroups}
            networks={networks}
            moreAccountsText={moreAccountsText}
            moreNetworksText={moreNetworksText}
            avatarAccountVariant={avatarAccountVariant}
            seedAddresses={seedAddresses}
          />
        }
        arrow
        offset={0}
        delay={50}
        duration={0}
        size="small"
        title={t('alertDisableTooltip')}
        trigger="mouseenter"
        theme="dark"
      >
        {hasAccountGroups && (
          <MultichainAvatarGroup
            type={MultichainAvatarGroupType.ACCOUNT}
            members={avatarAccountsData}
            limit={AVATAR_GROUP_LIMIT}
          />
        )}
        {hasNetworks && (
          <MultichainAvatarGroup
            type={MultichainAvatarGroupType.NETWORK}
            members={avatarNetworksData}
            limit={AVATAR_GROUP_LIMIT}
          />
        )}
      </Tooltip>
    );
  });

MultichainSiteCellTooltip.displayName = 'MultichainSiteCellTooltip';
