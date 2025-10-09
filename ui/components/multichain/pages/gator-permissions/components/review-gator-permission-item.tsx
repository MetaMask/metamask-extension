import React, { useMemo, useState } from 'react';
import {
  BoxFlexDirection,
  IconColor,
  BoxJustifyContent,
  TextColor,
  TextAlign,
  TextVariant,
  BoxBackgroundColor,
  Box,
  BoxAlignItems,
  Text,
  ButtonIcon,
  Icon,
  AvatarNetwork,
  AvatarNetworkSize,
  ButtonIconSize,
  IconName,
} from '@metamask/design-system-react';
import { getImageForChainId } from '../../../../../selectors/multichain';
import { getURLHost, shortenAddress } from '../../../../../helpers/utils/util';
import {
  PermissionTypesWithCustom,
  Signer,
  StoredGatorPermissionSanitized,
} from '@metamask/gator-permissions-controller';
import Card from '../../../../ui/card';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import {
  convertTimestampToReadableDate,
  getPeriodFrequencyLocaleTranslationKey,
  formatUnitsFromHex,
} from '../../../../../../shared/lib/gator-permissions';
import { useGatorTokenInfo } from '../../../../../hooks/gator-permissions/useGatorTokenInfo';
import { Hex } from 'viem';
import { PreferredAvatar } from '../../../../app/preferred-avatar';
import { BackgroundColor } from '../../../../../helpers/constants/design-system';

type ReviewGatorPermissionItemProps = {
  /**
   * The network name to display
   */
  networkName: string;

  /**
   * The gator permission to display
   */
  gatorPermission: StoredGatorPermissionSanitized<
    Signer,
    PermissionTypesWithCustom
  >;

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

export const ReviewGatorPermissionItem = ({
  networkName,
  gatorPermission,
  onRevokeClick,
}: ReviewGatorPermissionItemProps) => {
  const t = useI18nContext();
  const { permissionResponse, siteOrigin } = gatorPermission;

  const chainId = permissionResponse.chainId;
  const permissionType = permissionResponse.permission.type;

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
        permissionMetadata.frequency =
          'gatorPermissionWeeklyRedemptionFrequency';
        permissionMetadata.frequencyLabel =
          'gatorPermissionTokenPeriodicFrequencyLabel';
        permissionMetadata.amountLabel = 'Stream Amount';
        break;
      case 'native-token-periodic':
      case 'erc20-token-periodic':
        permissionMetadata.amount = `${
          formatUnitsFromHex({
            value: permissionResponse.permission.data.periodAmount as Hex,
            decimals: decimals || 0,
          }) as string
        } ${symbol || ''}`;
        permissionMetadata.frequency = getPeriodFrequencyLocaleTranslationKey(
          permissionResponse.permission.data.periodDuration,
        );
        permissionMetadata.frequencyLabel =
          'gatorPermissionTokenStreamFrequencyLabel';
        permissionMetadata.amountLabel = 'Amount';
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
        flexDirection={BoxFlexDirection.Row}
        justifyContent={BoxJustifyContent.Between}
        style={{ flex: '1', alignSelf: 'center' }}
        gap={4}
        marginTop={2}
      >
        <Text
          textAlign={TextAlign.Left}
          color={TextColor.TextAlternative}
          variant={TextVariant.BodyMd}
        >
          {key}
        </Text>
        <Text
          textAlign={TextAlign.Right}
          color={TextColor.TextAlternative}
          variant={TextVariant.BodyMd}
        >
          {value}
        </Text>
      </Box>
    );
  };

  if (gatorTokenInfoLoading || !gatorTokenInfo) {
    return (
      <Box
        justifyContent={BoxJustifyContent.Center}
        alignItems={BoxAlignItems.Center}
      >
        <Icon name={IconName.Loading} />
      </Box>
    );
  }

  return (
    <Card
      data-testid="review-gator-permission-item"
      gap={1}
      margin={4}
      backgroundColor={BackgroundColor.backgroundDefault}
    >
      <Box backgroundColor={BoxBackgroundColor.BackgroundAlternative}>
        <Box
          flexDirection={BoxFlexDirection.Row}
          justifyContent={BoxJustifyContent.Between}
          style={{ flex: '1', alignSelf: 'center' }}
          gap={2}
        >
          <Text
            variant={TextVariant.BodyMd}
            textAlign={TextAlign.Left}
            ellipsis
          >
            {getURLHost(siteOrigin)}
          </Text>
          <Box
            flexDirection={BoxFlexDirection.Row}
            justifyContent={BoxJustifyContent.End}
            style={{ flex: '1', alignSelf: 'center', cursor: 'pointer' }}
            gap={2}
            onClick={onRevokeClick}
          >
            <Text color={TextColor.ErrorDefault} variant={TextVariant.BodyMd}>
              Revoke
            </Text>
          </Box>
        </Box>
      </Box>

      <Box backgroundColor={BoxBackgroundColor.BackgroundDefault}>
        {/* Amount Row */}
        <Box
          flexDirection={BoxFlexDirection.Row}
          justifyContent={BoxJustifyContent.Between}
          style={{ flex: '1', alignSelf: 'center' }}
          gap={4}
          marginTop={2}
        >
          <Text
            textAlign={TextAlign.Left}
            color={TextColor.TextAlternative}
            variant={TextVariant.BodyMd}
          >
            {permissionDetails.amountLabel}
          </Text>
          <Box
            flexDirection={BoxFlexDirection.Row}
            justifyContent={BoxJustifyContent.End}
            style={{ flex: '1', alignSelf: 'center' }}
            gap={2}
            alignItems={BoxAlignItems.Center}
          >
            <Text
              variant={TextVariant.BodyMd}
              color={TextColor.TextAlternative}
            >
              {permissionDetails.amount}
            </Text>
          </Box>
        </Box>

        {/* Frequency Row */}
        <Box
          flexDirection={BoxFlexDirection.Row}
          justifyContent={BoxJustifyContent.Between}
          style={{ flex: '1', alignSelf: 'center' }}
          gap={4}
          marginTop={2}
        >
          <Text
            textAlign={TextAlign.Left}
            color={TextColor.TextAlternative}
            variant={TextVariant.BodyMd}
          >
            {permissionDetails.frequencyLabel}
          </Text>
          <Box
            flexDirection={BoxFlexDirection.Row}
            justifyContent={BoxJustifyContent.End}
            style={{ flex: '1', alignSelf: 'center' }}
            gap={2}
            alignItems={BoxAlignItems.Center}
          >
            <Text
              variant={TextVariant.BodyMd}
              color={TextColor.TextAlternative}
            >
              {t(permissionDetails.frequency)}
            </Text>
          </Box>
        </Box>

        {/* Account row */}
        <Box
          flexDirection={BoxFlexDirection.Row}
          justifyContent={BoxJustifyContent.Between}
          style={{ flex: '1', alignSelf: 'center' }}
          gap={4}
          marginTop={2}
        >
          <Text
            textAlign={TextAlign.Left}
            color={TextColor.TextAlternative}
            variant={TextVariant.BodyMd}
          >
            Account
          </Text>
          <Box
            flexDirection={BoxFlexDirection.Row}
            justifyContent={BoxJustifyContent.End}
            style={{ flex: '1', alignSelf: 'center' }}
            gap={2}
            alignItems={BoxAlignItems.Center}
          >
            <PreferredAvatar address={permissionResponse.address || ''} />
            <Text
              variant={TextVariant.BodyMd}
              color={TextColor.TextAlternative}
            >
              {shortenAddress(permissionResponse.address)}
            </Text>
          </Box>
        </Box>
      </Box>

      <Box backgroundColor={BoxBackgroundColor.BackgroundAlternative}>
        <Box
          flexDirection={BoxFlexDirection.Row}
          justifyContent={BoxJustifyContent.Between}
          style={{ flex: '1', alignSelf: 'center' }}
          gap={2}
          marginTop={2}
        >
          <Box
            flexDirection={BoxFlexDirection.Row}
            justifyContent={BoxJustifyContent.Between}
            style={{ flex: '1', alignSelf: 'center', cursor: 'pointer' }}
            gap={2}
            onClick={handleExpandClick}
          >
            <Text color={TextColor.PrimaryDefault} variant={TextVariant.BodyMd}>
              {isExpanded ? 'Hide Details' : 'Show Details'}
            </Text>
            <ButtonIcon
              iconName={isExpanded ? IconName.ArrowUp : IconName.ArrowDown}
              color={IconColor.IconMuted}
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
              flexDirection={BoxFlexDirection.Row}
              justifyContent={BoxJustifyContent.Between}
              style={{ flex: '1', alignSelf: 'center' }}
              gap={4}
              marginTop={2}
            >
              <Text
                textAlign={TextAlign.Left}
                color={TextColor.TextAlternative}
                variant={TextVariant.BodyMd}
              >
                Networks
              </Text>
              <Box
                flexDirection={BoxFlexDirection.Row}
                justifyContent={BoxJustifyContent.End}
                style={{ flex: '1', alignSelf: 'center' }}
                gap={2}
              >
                <AvatarNetwork
                  src={networkImageUrl}
                  name={chainId}
                  size={AvatarNetworkSize.Xs}
                />
                <Text
                  textAlign={TextAlign.Right}
                  color={TextColor.TextAlternative}
                  variant={TextVariant.BodyMd}
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
