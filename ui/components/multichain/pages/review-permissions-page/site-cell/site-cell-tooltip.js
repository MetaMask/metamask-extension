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

export const SiteCellTooltip = ({
  accounts,
  avatarAccountsData,
  networks,
  avatarNetworksData,
}) => {
  const t = useI18nContext();
  const AVATAR_GROUP_LIMIT = 4;
  const TOOLTIP_LIMIT = 4;
  const useBlockie = useSelector(getUseBlockie);
  const avatarAccountVariant = useBlockie
    ? AvatarAccountVariant.Blockies
    : AvatarAccountVariant.Jazzicon;

  return (
    <Tooltip
      position="bottom"
      html={
        <Box display={Display.Flex} flexDirection={FlexDirection.Column}>
          <Box display={Display.Flex} flexDirection={FlexDirection.Column}>
            {accounts?.slice(0, TOOLTIP_LIMIT).map((acc) => {
              return (
                <Box
                  display={Display.Flex}
                  flexDirection={FlexDirection.Row}
                  alignItems={AlignItems.center}
                  textAlign={TextAlign.Left}
                  key={acc.address}
                  padding={1}
                  paddingInline={2}
                  gap={2}
                >
                  <AvatarAccount
                    size={AvatarAccountSize.Xs}
                    address={acc.address}
                    variant={avatarAccountVariant}
                    borderStyle={BorderStyle.none}
                  />
                  <Text
                    color={TextColor.overlayInverse}
                    variant={TextVariant.bodyMdMedium}
                    data-testid="accounts-list-item-connected-account-name"
                    ellipsis
                  >
                    {acc.label || acc.metadata.name}
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
                    src={network.rpcPrefs?.imageUrl || ''}
                    name={network.nickname}
                    borderStyle={BorderStyle.none}
                  />
                  <Text
                    color={TextColor.overlayInverse}
                    variant={TextVariant.bodyMdMedium}
                    data-testid="accounts-list-item-connected-account-name"
                    ellipsis
                  >
                    {network.nickname}
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
      {accounts?.length > 0 ? (
        <AvatarGroup
          members={avatarAccountsData}
          limit={AVATAR_GROUP_LIMIT}
          avatarType={AvatarType.ACCOUNT}
          borderColor={BackgroundColor.backgroundDefault}
        />
      ) : (
        <AvatarGroup
          avatarType={AvatarType.TOKEN}
          members={avatarNetworksData}
          limit={AVATAR_GROUP_LIMIT}
        />
      )}
    </Tooltip>
  );
};
SiteCellTooltip.propTypes = {
  /**
   * An array of account objects to be displayed in the tooltip.
   * Each object should contain `address`, `label`, and `metadata.name`.
   */
  accounts: PropTypes.arrayOf(
    PropTypes.shape({
      address: PropTypes.string, // The unique address of the account.
      label: PropTypes.string, // Optional label for the account.
      metadata: PropTypes.shape({
        name: PropTypes.string, // Account's name from metadata.
      }),
    }),
  ),

  /**
   * Data for the avatar group component related to accounts.
   * This array contains account avatar data to be rendered in the group.
   */
  avatarAccountsData: PropTypes.arrayOf(
    PropTypes.shape({
      address: PropTypes.string, // The account address to display.
    }),
  ),

  /**
   * An array of network objects to display in the tooltip.
   */
  networks: PropTypes.arrayOf(
    PropTypes.shape({
      chainId: PropTypes.string, // The unique chain ID of the network.
      nickname: PropTypes.string, // The network's name.
      rpcPrefs: PropTypes.shape({
        imageUrl: PropTypes.string, // Optional URL for the network's image.
      }),
    }),
  ),

  /**
   * Data for the avatar group component related to networks.
   */
  avatarNetworksData: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string, // The network's name.
      avatarUrl: PropTypes.string, // Optional URL for the network's avatar image.
    }),
  ),
};
