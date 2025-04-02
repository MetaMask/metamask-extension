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

export const SiteCellTooltip = ({ accounts, networks }) => {
  const t = useI18nContext();
  const AVATAR_GROUP_LIMIT = 4;
  const TOOLTIP_LIMIT = 4;
  const useBlockie = useSelector(getUseBlockie);
  const avatarAccountVariant = useBlockie
    ? AvatarAccountVariant.Blockies
    : AvatarAccountVariant.Jazzicon;

  const avatarAccountsData = accounts?.map((account) => ({
    avatarValue: account.address,
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
                    {acc.metadata.name || acc.label}
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
   * An array of network objects to display in the tooltip.
   */
  networks: PropTypes.arrayOf(
    PropTypes.shape({
      chainId: PropTypes.string, // The unique chain ID of the network.
      name: PropTypes.string, // The network's name.
    }),
  ),
};
