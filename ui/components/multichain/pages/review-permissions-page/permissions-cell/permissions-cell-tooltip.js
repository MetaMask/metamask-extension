import React from 'react';
import PropTypes from 'prop-types';
import { Tooltip } from 'react-tippy';
import { AvatarType } from '../../../avatar-group/avatar-group.types';
import { AvatarGroup } from '../../../avatar-group';
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
import {
  AvatarNetwork,
  AvatarNetworkSize,
  Box,
  Text,
} from '../../../../component-library';
import { CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP } from '../../../../../../shared/constants/network';
import { useI18nContext } from '../../../../../hooks/useI18nContext';

export const PermissionsCellTooltip = ({ networks }) => {
  const t = useI18nContext();
  const AVATAR_GROUP_LIMIT = 4;
  const TOOLTIP_LIMIT = 4;

  const avatarNetworksData = networks?.map((network) => ({
    avatarValue: CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[network.chainId],
    symbol: network.name,
  }));

  if (!networks || networks.length === 0) {
    return null;
  }

  return (
    <Tooltip
      position="bottom"
      html={
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          data-test-id="permissions-cell-tooltip"
        >
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
                  <Text
                    color={TextColor.overlayInverse}
                    variant={TextVariant.bodyMdMedium}
                    data-testid="permissions-cell-network-name"
                    ellipsis
                  >
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
                  data-testid="permissions-cell-plus-more-tooltip"
                >
                  {t('moreNetworks', [networks.length - TOOLTIP_LIMIT])}
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
      trigger="mouseenter focus"
      theme="dark"
      tag="div"
    >
      <AvatarGroup
        members={avatarNetworksData}
        limit={AVATAR_GROUP_LIMIT}
        avatarType={AvatarType.TOKEN}
        borderColor={BackgroundColor.backgroundDefault}
      />
    </Tooltip>
  );
};

PermissionsCellTooltip.propTypes = {
  networks: PropTypes.arrayOf(
    PropTypes.shape({
      chainId: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    }),
  ),
};
