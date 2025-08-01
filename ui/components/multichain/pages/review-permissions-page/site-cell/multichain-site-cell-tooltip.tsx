import React from 'react';
import PropTypes from 'prop-types';
import { Tooltip } from 'react-tippy';
import { useSelector } from 'react-redux';
import {
  AlignItems,
  BackgroundColor,
  BorderStyle,
  Display,
  FlexDirection,
  TextAlign,
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import { AvatarType } from '../../../avatar-group/avatar-group.types';
import { AvatarGroup } from '../../..';
import {
  AvatarAccount,
  AvatarAccountSize,
  AvatarAccountVariant,
  AvatarNetwork,
  AvatarNetworkSize,
  Box,
  Text,
} from '../../../../component-library';
import { getUseBlockie } from '../../../../../selectors';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP } from '../../../../../../shared/constants/network';
import { AccountGroupWithInternalAccounts } from '../../../../../selectors/multichain-accounts/account-tree';

type MultichainSiteCellTooltipProps = {
  accounts: AccountGroupWithInternalAccounts[];
  networks: { chainId: string; name: string }[];
};

export const MultichainSiteCellTooltip = ({
  accounts,
  networks,
}: MultichainSiteCellTooltipProps) => {
  const t = useI18nContext();
  const AVATAR_GROUP_LIMIT = 4;
  const TOOLTIP_LIMIT = 4;
  const useBlockie = useSelector(getUseBlockie);
  const avatarAccountVariant = useBlockie
    ? AvatarAccountVariant.Blockies
    : AvatarAccountVariant.Jazzicon;

  const avatarAccountsData = accounts?.map((account) => ({
    avatarValue: account.id,
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
            {accounts?.slice(0, TOOLTIP_LIMIT).map((acc) => {
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
            {accounts?.length > TOOLTIP_LIMIT ||
            networks?.length > TOOLTIP_LIMIT ? (
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
                  {accounts?.length > 0
                    ? t('moreAccounts', [accounts?.length - TOOLTIP_LIMIT])
                    : t('moreNetworks', [networks.length - TOOLTIP_LIMIT])}
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
      trigger="mouseenter focus"
      theme="dark"
      tag="div"
    >
      {accounts?.length > 0 && (
        <AvatarGroup
          members={avatarAccountsData}
          limit={AVATAR_GROUP_LIMIT}
          avatarType={AvatarType.ACCOUNT}
          borderColor={BackgroundColor.backgroundDefault}
        />
      )}
      {networks?.length > 0 && (
        <AvatarGroup
          members={avatarNetworksData}
          limit={AVATAR_GROUP_LIMIT}
          avatarType={AvatarType.TOKEN}
        />
      )}
    </Tooltip>
  );
};
