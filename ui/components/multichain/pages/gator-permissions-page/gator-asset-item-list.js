import React from 'react';
import PropTypes from 'prop-types';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  Display,
  FlexDirection,
  IconColor,
  JustifyContent,
  TextAlign,
  TextColor,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import {
  AvatarNetwork,
  AvatarNetworkSize,
  Box,
  Icon,
  IconName,
  IconSize,
  Text,
} from '../../../component-library';
import { getImageForChainId } from '../../../../selectors/multichain';

export const GatorAssetItemList = ({
  chainId,
  total,
  description,
  onClick,
}) => {
  const networkImageUrl = getImageForChainId(chainId);

  return (
    <Box
      data-testid="gator-asset-item-list"
      as="button"
      display={Display.Flex}
      flexDirection={FlexDirection.Row}
      alignItems={AlignItems.baseline}
      width={BlockSize.Full}
      backgroundColor={BackgroundColor.backgroundDefault}
      onClick={onClick}
      padding={4}
      gap={4}
      className="multichain-gator-asset-item-list"
    >
      <Box
        display={Display.Flex}
        alignItems={AlignItems.center}
        style={{ alignSelf: 'center' }}
      >
        <AvatarNetwork
          data-testid="gator-asset-item__avatar-network"
          src={networkImageUrl}
          name={chainId}
          size={AvatarNetworkSize.Sm}
        />
      </Box>

      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        width={BlockSize.FiveTwelfths}
        style={{ alignSelf: 'center', flexGrow: '1' }}
      >
        <Text variant={TextVariant.bodyMd} textAlign={TextAlign.Left} ellipsis>
          {chainId}
        </Text>

        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Row}
          alignItems={AlignItems.center}
          gap={1}
        >
          <Text
            as="span"
            width={BlockSize.Max}
            color={TextColor.textAlternative}
            variant={TextVariant.bodyMd}
          >
            {total} {description}
          </Text>
        </Box>
      </Box>

      <Box
        display={Display.Flex}
        justifyContent={JustifyContent.flexEnd}
        alignItems={AlignItems.center}
        style={{ flex: '1', alignSelf: 'center' }}
        gap={2}
      >
        <Icon
          display={Display.Flex}
          name={IconName.ArrowRight}
          color={IconColor.iconDefault}
          size={IconSize.Sm}
          backgroundColor={BackgroundColor.backgroundDefault}
        />
      </Box>
    </Box>
  );
};

GatorAssetItemList.propTypes = {
  /**
   * The chain id to display
   */
  chainId: PropTypes.string.isRequired,

  /**
   * The count of permissions for the chain
   */
  total: PropTypes.number.isRequired,

  /**
   * The description of the permission
   */
  description: PropTypes.string.isRequired,

  /**
   * The function to call when the connection is clicked
   */
  onClick: PropTypes.func.isRequired,
};
