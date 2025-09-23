import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Tooltip } from 'react-tippy';
import { AvatarAccountSize } from '@metamask/design-system-react';
import {
  AlignItems,
  BorderStyle,
  Display,
  FlexDirection,
  TextAlign,
  TextColor,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import {
  AvatarNetwork,
  AvatarNetworkSize,
  Box,
  Text,
} from '../../../component-library';
import { PreferredAvatar } from '../../../app/preferred-avatar';
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

export type MultichainSiteCellTooltipProps = {
  accountGroups?: AccountGroupWithInternalAccounts[];
  networks?: EvmAndMultichainNetworkConfigurationsWithCaipChainId[];
};

const TOOLTIP_LIMIT = 4;
const AVATAR_GROUP_LIMIT = 4;

type TooltipContentProps = {
  accountGroups?: AccountGroupWithInternalAccounts[];
  networks?: EvmAndMultichainNetworkConfigurationsWithCaipChainId[];
};

const TooltipContent = React.memo<TooltipContentProps>(
  ({ accountGroups, networks }) => {
    const t = useI18nContext();

    const displayAccountGroups = accountGroups?.slice(0, TOOLTIP_LIMIT) ?? [];
    const displayNetworks = networks?.slice(0, TOOLTIP_LIMIT) ?? [];
    const hasMoreAccounts =
      accountGroups && accountGroups.length > TOOLTIP_LIMIT;
    const hasMoreNetworks = networks && networks.length > TOOLTIP_LIMIT;

    const getMoreText = useMemo(() => {
      if (hasMoreAccounts && accountGroups) {
        return t('moreAccounts', [accountGroups.length - TOOLTIP_LIMIT]);
      }
      if (networks) {
        return t('moreNetworks', [networks.length - TOOLTIP_LIMIT]);
      }
      return '';
    }, [hasMoreAccounts, accountGroups, networks, t]);

    return (
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        data-test-id="site-cell-tooltip"
      >
        <Box display={Display.Flex} flexDirection={FlexDirection.Column}>
          {displayAccountGroups.map((acc) => (
            <Box
              display={Display.Flex}
              flexDirection={FlexDirection.Row}
              alignItems={AlignItems.center}
              textAlign={TextAlign.Left}
              key={acc.id}
              padding={1}
              paddingInline={2}
              gap={2}
            >
              <PreferredAvatar size={AvatarAccountSize.Xs} address={acc.id} />
              <Text
                color={TextColor.overlayInverse}
                variant={TextVariant.bodyMdMedium}
                data-testid="accounts-list-item-connected-account-name"
                ellipsis
              >
                {acc.metadata.name}
              </Text>
            </Box>
          ))}
          {displayNetworks.map((network) => (
            <Box
              display={Display.Flex}
              flexDirection={FlexDirection.Row}
              alignItems={AlignItems.center}
              textAlign={TextAlign.Left}
              key={network.chainId}
              padding={1}
              paddingInline={2}
              gap={2}
            >
              <AvatarNetwork
                size={AvatarNetworkSize.Xs}
                src={CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[network.chainId]}
                name={network.name}
                borderStyle={BorderStyle.none}
              />
              <Text
                color={TextColor.overlayInverse}
                variant={TextVariant.bodyMdMedium}
                data-testid="accounts-list-item-connected-account-name"
                ellipsis
              >
                {network.name}
              </Text>
            </Box>
          ))}
          {((accountGroups &&
            Array.isArray(accountGroups) &&
            hasMoreAccounts) ||
            (networks && Array.isArray(networks) && hasMoreNetworks)) && (
            <Box
              display={Display.Flex}
              alignItems={AlignItems.center}
              textAlign={TextAlign.Left}
              paddingInline={2}
            >
              <Text
                color={TextColor.textMuted}
                variant={TextVariant.bodyMdMedium}
                data-testid="accounts-list-item-plus-more-tooltip"
              >
                {getMoreText()}
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

    return (
      <Tooltip
        position="bottom"
        html={
          <TooltipContent accountGroups={accountGroups} networks={networks} />
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
