import React, { useMemo } from 'react';
import { Tooltip } from 'react-tippy';
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
  AvatarAccount,
  AvatarAccountSize,
  AvatarAccountVariant,
  AvatarNetwork,
  AvatarNetworkSize,
  Box,
  Text,
} from '../../../component-library';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP } from '../../../../../shared/constants/network';
import { AvatarGroup } from '../../../multichain/avatar-group';
import { AvatarType } from '../../../multichain/avatar-group/avatar-group.types';
import { AccountGroupWithInternalAccounts } from '../../../../selectors/multichain-accounts/account-tree.types';
import { EvmAndMultichainNetworkConfigurationsWithCaipChainId } from '../../../../selectors/selectors.types';
import { MultichainAccountAvatarGroup } from '../avatar-group/multichain-avatar-group';

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
    const avatarAccountVariant = AvatarAccountVariant.Blockies;

    const displayAccountGroups = accountGroups?.slice(0, TOOLTIP_LIMIT) ?? [];
    const displayNetworks = networks?.slice(0, TOOLTIP_LIMIT) ?? [];
    const hasMoreAccounts =
      accountGroups && accountGroups.length > TOOLTIP_LIMIT;
    const hasMoreNetworks = networks && networks.length > TOOLTIP_LIMIT;

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
              <AvatarAccount
                size={AvatarAccountSize.Xs}
                address={acc.id}
                variant={avatarAccountVariant}
                borderStyle={BorderStyle.none}
              />
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
                {hasMoreAccounts && accountGroups
                  ? t('moreAccounts', [accountGroups.length - TOOLTIP_LIMIT])
                  : networks
                    ? t('moreNetworks', [networks.length - TOOLTIP_LIMIT])
                    : ''}
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

    const avatarAccountsData = useMemo(() => {
      return (
        accountGroups?.map((accountGroup) => {
          return {
            avatarValue: accountGroup.accounts[0].address,
          };
        }) ?? []
      );
    }, [accountGroups]);

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
          <MultichainAccountAvatarGroup
            members={avatarAccountsData}
            limit={AVATAR_GROUP_LIMIT}
          />
        )}
        {hasNetworks && (
          <AvatarGroup
            members={avatarNetworksData}
            limit={AVATAR_GROUP_LIMIT}
            avatarType={AvatarType.TOKEN}
          />
        )}
      </Tooltip>
    );
  });

MultichainSiteCellTooltip.displayName = 'MultichainSiteCellTooltip';
