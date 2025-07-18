import React from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import {
  AlignItems,
  BorderStyle,
  Display,
  FlexDirection,
  TextAlign,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { AvatarType } from '../avatar-group/avatar-group.types';
import { AvatarGroup } from '../avatar-group';
import {
  AvatarNetwork,
  AvatarNetworkSize,
  AvatarTokenSize,
  Box,
  Text,
} from '../../component-library';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP } from '../../../../shared/constants/network';
import { getNetworksByScopes } from '../../../../shared/modules/selectors/networks';
import Tooltip from '../../ui/tooltip';

export const AccountNetworkIndicator = ({ scopes }: { scopes: string[] }) => {
  const t = useI18nContext();
  const AVATAR_GROUP_LIMIT = 4;
  const TOOLTIP_LIMIT = 12;

  const networks = useSelector((state) => getNetworksByScopes(state, scopes));

  const avatarNetworksData = networks?.map(
    (network: { chainId: string | number; name: string }) => ({
      avatarValue: CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[network.chainId],
      symbol: network.name,
    }),
  );

  return (
    <Box data-testid="account-network-indicator">
      <Tooltip
        position="left"
        html={
          <Box display={Display.Flex} flexDirection={FlexDirection.Column}>
            <Box display={Display.Flex} flexDirection={FlexDirection.Column}>
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
                    <Text variant={TextVariant.bodyMdMedium} ellipsis>
                      {network.name}
                    </Text>
                  </Box>
                );
              })}
              {networks?.length > TOOLTIP_LIMIT ? (
                <Box
                  display={Display.Flex}
                  alignItems={AlignItems.center}
                  textAlign={TextAlign.Left}
                  paddingInline={2}
                >
                  <Text
                    color={TextColor.textMuted}
                    variant={TextVariant.bodyMdMedium}
                  >
                    t('moreNetworks', [networks.length - TOOLTIP_LIMIT])
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
      >
        <AvatarGroup
          members={avatarNetworksData}
          limit={AVATAR_GROUP_LIMIT}
          avatarType={AvatarType.NETWORK}
          size={AvatarTokenSize.Xl}
        />
      </Tooltip>
    </Box>
  );
};
AccountNetworkIndicator.propTypes = {
  /**
   * An array of CAIP scope strings, used to determine which networks to display.
   */
  scopes: PropTypes.arrayOf(PropTypes.string).isRequired,
};
