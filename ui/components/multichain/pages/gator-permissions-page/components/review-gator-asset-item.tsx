import React, { useState } from 'react';
import {
  AlignItems,
  BlockSize,
  Color,
  Display,
  FlexDirection,
  IconColor,
  JustifyContent,
  TextColor,
  TextAlign,
  TextVariant,
  BackgroundColor,
  BorderRadius,
} from '../../../../../helpers/constants/design-system';
import {
  AvatarAccount,
  AvatarAccountSize,
  AvatarNetwork,
  AvatarNetworkSize,
  Box,
  ButtonIcon,
  ButtonIconSize,
  IconName,
  Text,
} from '../../../../component-library';
import { getImageForChainId } from '../../../../../selectors/multichain';
import { getURLHost, shortenAddress } from '../../../../../helpers/utils/util';
import {
  PermissionTypes,
  SignerParam,
  StoredGatorPermissionSanitized,
} from '@metamask/gator-permissions-controller';
import { extractNetworkName } from '../gator-permissions-page-helper';
import { NetworkConfiguration } from '@metamask/network-controller';

type ReviewGatorAssetItemProps = {
  /**
   * The networks to display
   */
  networks: Record<`0x${string}`, NetworkConfiguration>;

  /**
   * The gator permission to display
   */
  gatorPermission: StoredGatorPermissionSanitized<SignerParam, PermissionTypes>;

  /**
   * The function to call when the revoke is clicked
   */
  onRevokeClick: () => void;
};

type PermissionDetails = Record<string, string>;

export const ReviewGatorAssetItem = ({
  networks,
  gatorPermission,
  onRevokeClick,
}: ReviewGatorAssetItemProps) => {
  const { permissionResponse, siteOrigin } = gatorPermission;

  const chainId = permissionResponse.chainId;
  const permissionType = permissionResponse.permission.type;
  const networkName = extractNetworkName(
    networks,
    permissionResponse.chainId,
    true,
  );

  const networkImageUrl = getImageForChainId(chainId);
  const [isExpanded, setIsExpanded] = useState(false);

  /**
   * Handles the click event for the expand/collapse button
   */
  const handleExpandClick = () => {
    setIsExpanded(!isExpanded);
  };

  /**
   * Returns the expanded permission details
   */
  const expandedPermissionSecondaryDetails = (): PermissionDetails => {
    switch (permissionType) {
      case 'native-token-stream':
      case 'erc20-token-stream':
        return {
          'Initial Allowance': (permissionResponse.permission.data
            .initialAllowance || '0') as string,
          'Max Allowance': (permissionResponse.permission.data.maxAllowance ||
            '0') as string,
          'Start Date': (permissionResponse.permission.data.startTime ||
            '0') as string,
          'Expiration Date': (permissionResponse.expiry || '0') as string,
          'Stream Rate':
            ((permissionResponse.permission.data.amountPerSecond ||
              '0') as string) + '/sec',
        };
      case 'native-token-periodic':
      case 'erc20-token-periodic':
        return {
          Allowance: (permissionResponse.permission.data.periodAmount ||
            '0') as string,
          'Start Date': (permissionResponse.permission.data.startTime ||
            '0') as string,
          'Expiration Date': (permissionResponse.permission.data.expiryDate ||
            '0') as string,
        };
      default:
        return {};
    }
  };

  /**
   * Renders the permission details row
   */
  const renderPermissionDetailsRow = (key: string, value: string) => {
    return (
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        justifyContent={JustifyContent.spaceBetween}
        style={{ flex: '1', alignSelf: 'center' }}
        gap={4}
        marginTop={2}
      >
        <Text
          textAlign={TextAlign.Left}
          width={BlockSize.Max}
          color={TextColor.textAlternative}
          variant={TextVariant.bodyMd}
        >
          {key}
        </Text>
        <Text
          textAlign={TextAlign.Right}
          width={BlockSize.Max}
          color={TextColor.textAlternative}
          variant={TextVariant.bodyMd}
        >
          {value}
        </Text>
      </Box>
    );
  };


  return (
    <Box gap={1} margin={4}>
      <Box
        data-testid="review-gator-asset-item"
        className="multichain-review-gator-asset-item"
        backgroundColor={BackgroundColor.backgroundAlternative}
        borderRadius={[
          BorderRadius.LG,
          BorderRadius.LG,
          BorderRadius.none,
          BorderRadius.none,
        ]}
        padding={4}
        marginBottom={1}
      >
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Row}
          justifyContent={JustifyContent.spaceBetween}
          style={{ flex: '1', alignSelf: 'center' }}
          gap={2}
        >
          <Text
            variant={TextVariant.bodyMd}
            textAlign={TextAlign.Left}
            ellipsis
          >
            {getURLHost(siteOrigin)}
          </Text>
          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Row}
            justifyContent={JustifyContent.flexEnd}
            style={{ flex: '1', alignSelf: 'center', cursor: 'pointer' }}
            gap={2}
            onClick={onRevokeClick}
          >
            <Text
              width={BlockSize.Max}
              color={TextColor.errorDefault}
              variant={TextVariant.bodyMd}
            >
              Revoke
            </Text>
          </Box>
        </Box>
      </Box>

      <Box
        data-testid="review-gator-asset-item"
        className="multichain-review-gator-asset-item"
        backgroundColor={BackgroundColor.backgroundAlternative}
        padding={4}
      >
        {/* Network name row */}
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Row}
          justifyContent={JustifyContent.spaceBetween}
          style={{ flex: '1', alignSelf: 'center' }}
          gap={4}
          marginTop={2}
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

        {/* Account row */}
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Row}
          justifyContent={JustifyContent.spaceBetween}
          style={{ flex: '1', alignSelf: 'center' }}
          gap={4}
          marginTop={2}
        >
          <Text
            textAlign={TextAlign.Left}
            width={BlockSize.Max}
            color={TextColor.textAlternative}
            variant={TextVariant.bodyMd}
          >
            Account
          </Text>
          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Row}
            justifyContent={JustifyContent.flexEnd}
            style={{ flex: '1', alignSelf: 'center' }}
            gap={2}
            alignItems={AlignItems.center}
          >
            <AvatarAccount
              data-testid="gator-asset-item__avatar-account"
              address={permissionResponse.address || ''}
              size={AvatarAccountSize.Xs}
            />
            <Text
              variant={TextVariant.bodyMd}
              color={TextColor.textAlternative}
              marginLeft={2}
            >
              {shortenAddress(permissionResponse.address)}
              {/* {account.avatarName} */}
            </Text>
          </Box>
        </Box>
      </Box>

      <Box
        data-testid="review-gator-asset-item"
        className="multichain-review-gator-asset-item"
        backgroundColor={BackgroundColor.backgroundAlternative}
        padding={4}
        borderRadius={[
          BorderRadius.none,
          BorderRadius.none,
          BorderRadius.LG,
          BorderRadius.LG,
        ]}
        marginTop={1}
      >
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Row}
          justifyContent={JustifyContent.spaceBetween}
          style={{ flex: '1', alignSelf: 'center' }}
          gap={2}
          marginTop={2}
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
              {isExpanded ? 'Hide Details' : 'Show Details'}
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

        {isExpanded && (
          <>
            {Object.entries(expandedPermissionSecondaryDetails()).map(
              ([key, value]) => {
                return renderPermissionDetailsRow(key, value);
              },
            )}
          </>
        )}
      </Box>
    </Box>
  );
};
