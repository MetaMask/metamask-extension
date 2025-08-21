import React from 'react';
import { Tooltip } from 'react-tippy';
import {
  AlignItems,
  BorderColor,
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
import { CaipChainId } from '@metamask/utils';
import { AccountGroupWithInternalAccounts } from '../../../../selectors/multichain-accounts/account-tree.types';
import { Network } from '../tool-tip.types';

interface SiteCellTooltipProps {
  accountGroups?: AccountGroupWithInternalAccounts[];
  networks?: Network[];
}

export const MultichainSiteCellTooltip = ({
  accountGroups,
  networks,
}: SiteCellTooltipProps) => {
  const t = useI18nContext();
  const AVATAR_GROUP_LIMIT = 4;
  const TOOLTIP_LIMIT = 4;

  // TODO: replace with maskicon when available.
  const avatarAccountVariant = AvatarAccountVariant.Blockies;

  const avatarAccountsData = accountGroups?.map((accountGroup) => ({
    avatarValue: accountGroup.id,
  }));

  const avatarNetworksData = networks?.map((network) => ({
    avatarValue: CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[network.chainId],
    symbol: network.name,
  }));

  return (
    <Tooltip
      position="bottom"
      html={
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          data-test-id="site-cell-tooltip"
        >
          <Box display={Display.Flex} flexDirection={FlexDirection.Column}>
            {accountGroups?.slice(0, TOOLTIP_LIMIT).map((acc) => {
              return (
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
              );
            })}
            {networks?.slice(0, TOOLTIP_LIMIT).map((network) => {
              return (
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
              );
            })}
            {(accountGroups && accountGroups.length > TOOLTIP_LIMIT) ||
            (networks && networks.length > TOOLTIP_LIMIT) ? (
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
                  {Boolean(accountGroups?.length && accountGroups.length > 0)
                    ? t('moreAccounts', [
                        typeof accountGroups?.length === 'number'
                          ? accountGroups.length - TOOLTIP_LIMIT
                          : 0,
                      ])
                    : t('moreNetworks', [
                        typeof networks?.length === 'number'
                          ? networks.length - TOOLTIP_LIMIT
                          : 0,
                      ])}
                </Text>
              </Box>
            ) : null}
          </Box>
        </Box>
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
      {Array.isArray(accountGroups) && accountGroups.length > 0 && (
        <AvatarGroup
          members={avatarAccountsData ?? []}
          limit={AVATAR_GROUP_LIMIT}
          avatarType={AvatarType.ACCOUNT}
          borderColor={BorderColor.borderDefault}
        />
      )}
      {Array.isArray(avatarNetworksData) && avatarNetworksData.length > 0 && (
        <AvatarGroup
          members={avatarNetworksData}
          limit={AVATAR_GROUP_LIMIT}
          avatarType={AvatarType.TOKEN}
        />
      )}
    </Tooltip>
  );
};
