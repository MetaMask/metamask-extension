import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  BlockSize,
  Display,
  FlexDirection,
  IconColor,
  JustifyContent,
  TextColor,
  TextAlign,
  TextVariant,
  BackgroundColor,
} from '../../../../../helpers/constants/design-system';
import Card from '../../../../ui/card';
import {
  AvatarNetwork,
  AvatarNetworkSize,
  Box,
  ButtonIcon,
  ButtonIconSize,
  IconName,
  Text,
} from '../../../../component-library';
import { getImageForChainId } from '../../../../../selectors/multichain';
import { getURLHost } from '../../../../../helpers/utils/util';

export const ReviewGatorAssetItem = ({
  chainId,
  networkName,
  permissionType,
  siteOrigin,
  onRevokeClick,
}) => {
  const networkImageUrl = getImageForChainId(chainId);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleExpandClick = () => {
    setIsExpanded(!isExpanded);
  };

  const renderNetworkNameRow = () => {
    return (
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        justifyContent={JustifyContent.spaceBetween}
        style={{ flex: '1', alignSelf: 'center' }}
        gap={4}
      >
        <Text
          textAlign={TextAlign.Left}
          width={BlockSize.Max}
          color={TextColor.textAlternative}
          variant={TextVariant.bodyMd}
        >
          Networks
        </Text>
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Row}
          justifyContent={JustifyContent.flexEnd}
          style={{ flex: '1', alignSelf: 'center' }}
          gap={2}
        >
          <AvatarNetwork
            data-testid="gator-asset-item__avatar-network"
            src={networkImageUrl}
            name={chainId}
            size={AvatarNetworkSize.Xs}
          />
          <Text
            textAlign={TextAlign.Right}
            width={BlockSize.Max}
            color={TextColor.textAlternative}
            variant={TextVariant.bodyMd}
          >
            {networkName}
          </Text>
        </Box>
      </Box>
    );
  };

  const renderPermissionTypeRow = () => {
    return (
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        justifyContent={JustifyContent.spaceBetween}
        style={{ flex: '1', alignSelf: 'center' }}
        gap={4}
      >
        <Text
          textAlign={TextAlign.Left}
          width={BlockSize.Max}
          color={TextColor.textAlternative}
          variant={TextVariant.bodyMd}
        >
          Permission Type
        </Text>
        <Text
          textAlign={TextAlign.Right}
          width={BlockSize.Max}
          color={TextColor.textAlternative}
          variant={TextVariant.bodyMd}
        >
          {permissionType}
        </Text>
      </Box>
    );
  };

  const renderExpandedContent = () => {
    return (
      <>
        {renderNetworkNameRow()}
        {renderPermissionTypeRow()}
      </>
    );
  };

  return (
    <Card
      data-testid="review-gator-asset-item"
      className="multichain-review-gator-asset-item"
      backgroundColor={BackgroundColor.backgroundAlternative}
      padding={4}
      margin={4}
      gap={4}
    >
      {/* Revoke button row */}
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        justifyContent={JustifyContent.spaceBetween}
        style={{ flex: '1', alignSelf: 'center' }}
        gap={2}
      >
        <Text variant={TextVariant.bodyMd} textAlign={TextAlign.Left} ellipsis>
          {getURLHost(siteOrigin)}
        </Text>
        <Text
          width={BlockSize.Max}
          color={TextColor.errorDefault}
          onClick={onRevokeClick}
          variant={TextVariant.bodyMd}
        >
          Revoke
        </Text>
      </Box>

      {/* Expand/Collapse button row */}
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        justifyContent={JustifyContent.spaceBetween}
        style={{ flex: '1', alignSelf: 'center' }}
        gap={2}
      >
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Row}
          justifyContent={JustifyContent.spaceBetween}
          style={{ flex: '1', alignSelf: 'center', cursor: 'pointer' }}
          gap={2}
          onClick={handleExpandClick}
        >
          <Text
            width={BlockSize.Max}
            color={TextColor.primaryDefault}
            variant={TextVariant.bodyMd}
          >
            {isExpanded ? 'Hide' : 'Details'}
          </Text>
          <ButtonIcon
            iconName={isExpanded ? IconName.ArrowUp : IconName.ArrowDown}
            color={IconColor.iconMuted}
            size={ButtonIconSize.Sm}
            onClick={handleExpandClick}
            ariaLabel="expand"
          />
        </Box>
      </Box>

      {isExpanded && renderExpandedContent()}
    </Card>
  );
};

ReviewGatorAssetItem.propTypes = {
  /**
   * The chain id to display
   */
  chainId: PropTypes.string.isRequired,

  /**
   * The network name to display
   */
  networkName: PropTypes.string.isRequired,

  /**
   * The site origin to display
   */
  siteOrigin: PropTypes.string.isRequired,

  /**
   * The permission type to display
   */
  permissionType: PropTypes.string.isRequired,

  /**
   * The function to call when the revoke is clicked
   */
  onRevokeClick: PropTypes.func.isRequired,
};
