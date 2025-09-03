import React, { useMemo, useState } from 'react';
import {
  AlignItems,
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
import {
  AvatarAccount,
  AvatarAccountSize,
  AvatarNetwork,
  AvatarNetworkSize,
  Box,
  ButtonIcon,
  ButtonIconSize,
  IconName,
  Icon,
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
import Card from '../../../../ui/card';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import {
  convertTimestampToReadableDate,
  formatPeriodFrequency,
  formatUnitsFromHex,
} from '../../../../../../shared/lib/gator-permissions-utils';
import { useGatorTokenInfo } from '../../../../../hooks/gator-permissions/useGatorTokenInfo';
import { Hex } from 'viem';

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

type PermissionExpandedDetails = Record<string, string>;

type PermissionDetails = {
  amountLabel: string;
  frequencyLabel: string;
  amount: string;
  frequency: string;
};

export const ReviewGatorAssetItem = ({
  networks,
  gatorPermission,
  onRevokeClick,
}: ReviewGatorAssetItemProps) => {
  const t = useI18nContext();
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

  const { loading: gatorTokenInfoLoading, data: gatorTokenInfo } =
    useGatorTokenInfo(
      permissionType,
      chainId,
      permissionResponse.permission.data.tokenAddress as string,
    );

  /**
   * Handles the click event for the expand/collapse button
   */
  const handleExpandClick = () => {
    setIsExpanded(!isExpanded);
  };

  /**
   * Returns the expanded permission details
   */
  const expandedPermissionSecondaryDetails =
    useMemo((): PermissionExpandedDetails => {
      const { symbol, decimals } = gatorTokenInfo || {};
      switch (permissionType) {
        case 'native-token-stream':
        case 'erc20-token-stream':
          return {
            'Initial Allowance': `${
              formatUnitsFromHex({
                value: permissionResponse.permission.data.initialAmount as Hex,
                decimals: decimals || 0,
              }) as string
            } ${symbol || ''}`,
            'Max Allowance': `${
              formatUnitsFromHex({
                value: permissionResponse.permission.data.maxAmount as Hex,
                decimals: decimals || 0,
              }) as string
            } ${symbol || ''}`,
            'Start Date': convertTimestampToReadableDate(
              permissionResponse.permission.data.startTime as number,
            ),
            'Expiration Date': 'N/A', // TODO: Add expiry date once the type have been updated in the controller: https://github.com/MetaMask/core/pull/6379
            'Stream Rate':
              (formatUnitsFromHex({
                value: permissionResponse.permission.data
                  .amountPerSecond as Hex,
                decimals: decimals || 0,
              }) as string) +
              ` ${symbol || ''}` +
              '/sec',
          };
        case 'native-token-periodic':
        case 'erc20-token-periodic':
          return {
            'Start Date': convertTimestampToReadableDate(
              permissionResponse.permission.data.startTime as number,
            ),
            'Expiration Date': 'N/A', // TODO: Add expiry date once the type have been updated in the controller: https://github.com/MetaMask/core/pull/6379
          };
        default:
          return {};
      }
    }, [permissionType, permissionResponse, gatorTokenInfo]);

  /**
   * Returns the permission details
   */
  const permissionDetails = useMemo((): PermissionDetails => {
    let permissionMetadata = {
      amountLabel: '',
      frequencyLabel: '',
      amount: '0',
      frequency: '',
    };
    const { symbol, decimals } = gatorTokenInfo || {};
    switch (permissionType) {
      case 'native-token-stream':
      case 'erc20-token-stream':
        permissionMetadata.amount = `${
          formatUnitsFromHex({
            value: permissionResponse.permission.data.amountPerSecond as Hex,
            decimals: decimals || 0,
          }) as string
        } ${symbol || ''}`;
        permissionMetadata.frequency = 'weekly';
        permissionMetadata.amountLabel = 'Stream Amount';
        permissionMetadata.frequencyLabel = 'Period';
        break;
      case 'native-token-periodic':
      case 'erc20-token-periodic':
        permissionMetadata.amount = `${
          formatUnitsFromHex({
            value: permissionResponse.permission.data.periodAmount as Hex,
            decimals: decimals || 0,
          }) as string
        } ${symbol || ''}`;
        permissionMetadata.frequency = formatPeriodFrequency(
          permissionResponse.permission.data.periodDuration,
        );
        permissionMetadata.amountLabel = 'Amount';
        permissionMetadata.frequencyLabel = 'Transfer Window';
        break;
      default:
        break;
    }
    return permissionMetadata;
  }, [permissionType, permissionResponse]);

  /**
   * Renders the permission details row
   */
  const renderExpandedPermissionDetailsRow = (key: string, value: string) => {
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

  if (gatorTokenInfoLoading || !gatorTokenInfo) {
    return (
      <Box
        display={Display.Flex}
        justifyContent={JustifyContent.center}
        alignItems={AlignItems.center}
      >
        <Icon name={IconName.Loading} />
      </Box>
    );
  }

  return (
    <Card
      gap={1}
      margin={4}
      backgroundColor={BackgroundColor.backgroundAlternative}
    >
      <Box
        data-testid="review-gator-asset-item"
        className="multichain-review-gator-asset-item"
        backgroundColor={BackgroundColor.backgroundAlternative}
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
      >
        {/* Amount Row */}
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
            {permissionDetails.amountLabel}
          </Text>
          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Row}
            justifyContent={JustifyContent.flexEnd}
            style={{ flex: '1', alignSelf: 'center' }}
            gap={2}
            alignItems={AlignItems.center}
          >
            <Text
              variant={TextVariant.bodyMd}
              color={TextColor.textAlternative}
              marginLeft={2}
            >
              {permissionDetails.amount}
            </Text>
          </Box>
        </Box>

        {/* Frequency Row */}
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
            {permissionDetails.frequencyLabel}
          </Text>
          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Row}
            justifyContent={JustifyContent.flexEnd}
            style={{ flex: '1', alignSelf: 'center' }}
            gap={2}
            alignItems={AlignItems.center}
          >
            <Text
              variant={TextVariant.bodyMd}
              color={TextColor.textAlternative}
              marginLeft={2}
            >
              {t(permissionDetails.frequency)}
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
            </Text>
          </Box>
        </Box>
      </Box>

      <Box
        data-testid="review-gator-asset-item"
        className="multichain-review-gator-asset-item"
        backgroundColor={BackgroundColor.backgroundAlternative}
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
            {Object.entries(expandedPermissionSecondaryDetails).map(
              ([key, value]) => {
                return renderExpandedPermissionDetailsRow(key, value);
              },
            )}
          </>
        )}
      </Box>
    </Card>
  );
};
