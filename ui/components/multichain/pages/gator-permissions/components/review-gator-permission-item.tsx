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
import {
  Erc20TokenPeriodicPermission,
  Erc20TokenStreamPermission,
  NativeTokenPeriodicPermission,
  NativeTokenStreamPermission,
  PermissionTypesWithCustom,
  Signer,
  StoredGatorPermissionSanitized,
} from '@metamask/gator-permissions-controller';
import { getImageForChainId } from '../../../../../selectors/multichain';
import { getURLHost, shortenAddress } from '../../../../../helpers/utils/util';
import Card from '../../../../ui/card';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import {
  convertTimestampToReadableDate,
  getPeriodFrequencyValueTranslationKey,
  extractExpiryToReadableDate,
} from '../../../../../../shared/lib/gator-permissions';
import { useGatorTokenInfo } from '../../../../../hooks/gator-permissions/useGatorTokenInfo';
import { Hex } from 'viem';
import { PreferredAvatar } from '../../../../app/preferred-avatar';
import { BackgroundColor } from '../../../../../helpers/constants/design-system';
import { Numeric } from '../../../../../../shared/modules/Numeric';

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

/**
 * The expanded permission details key(translation key) -> value
 */
type PermissionExpandedDetails = Record<string, string>;

type PermissionDetails = {
  amountLabel: {
    translationKey: string;
    value: string;
  };
  frequencyLabel: {
    translationKey: string;
    valueTranslationKey: string;
  };
  expandedDetails: PermissionExpandedDetails;
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
  const permissionAccount = permissionResponse.address || '0x';

  const networkImageUrl = getImageForChainId(chainId);
  const [isExpanded, setIsExpanded] = useState(false);

  const getDecimalizedHexValue = (value: Hex, assetDecimals: number) =>
    new Numeric(value, 16).toBase(10).shiftedBy(assetDecimals).toString();

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
   * Returns the token stream permission details
   * @param assetDecimals - The number of decimal places the token uses
   * @param tokenSymbol - The symbol of the token
   * @param permission - The stream permission data
   * @returns The permission details
   */
  const getTokenStreamPermissionDetails = (
    assetDecimals: number,
    tokenSymbol: string,
    permission: NativeTokenStreamPermission | Erc20TokenStreamPermission,
  ): PermissionDetails => {
    return {
      amountLabel: {
        translationKey: 'gatorPermissionsStreamingAmountLabel',
        value: `${getDecimalizedHexValue(
          permission.data.amountPerSecond,
          assetDecimals,
        )} ${tokenSymbol}`,
      },
      frequencyLabel: {
        translationKey: 'gatorPermissionTokenStreamFrequencyLabel',
        valueTranslationKey: 'gatorPermissionWeeklyFrequency',
      },
      expandedDetails: {
        gatorPermissionsInitialAllowance: `${getDecimalizedHexValue(
          permission.data.initialAmount || '0x0',
          assetDecimals,
        )} ${tokenSymbol}`,
        gatorPermissionsMaxAllowance: `${getDecimalizedHexValue(
          permission.data.maxAmount || '0x0',
          assetDecimals,
        )} ${tokenSymbol}`,
        gatorPermissionsStartDate: convertTimestampToReadableDate(
          permission.data.startTime as number,
        ),
        gatorPermissionsExpirationDate: extractExpiryToReadableDate(
          (permission as any).rules || [],
        ), // TODO: Need to expose rules on StoredGatorPermissionSanitized in the gator-permissions-controller
        gatorPermissionsStreamRate: `${getDecimalizedHexValue(
          permission.data.amountPerSecond,
          assetDecimals,
        )} ${tokenSymbol}/sec`,
      },
    };
  };

  /**
   * Returns the token periodic permission details
   * @param assetDecimals - The number of decimal places the token uses
   * @param tokenSymbol - The symbol of the token
   * @param permission - The periodic permission data
   * @returns The permission details
   */
  const getTokenPeriodicPermissionDetails = (
    assetDecimals: number,
    tokenSymbol: string,
    permission: NativeTokenPeriodicPermission | Erc20TokenPeriodicPermission,
  ): PermissionDetails => {
    return {
      amountLabel: {
        translationKey: 'amount',
        value: `${getDecimalizedHexValue(
          permission.data.periodAmount,
          assetDecimals,
        )} ${tokenSymbol}`,
      },
      frequencyLabel: {
        translationKey: 'gatorPermissionTokenPeriodicFrequencyLabel',
        valueTranslationKey: getPeriodFrequencyValueTranslationKey(
          permission.data.periodDuration,
        ),
      },
      expandedDetails: {
        gatorPermissionsStartDate: convertTimestampToReadableDate(
          permission.data.startTime ?? 0,
        ),
        gatorPermissionsExpirationDate: extractExpiryToReadableDate(
          (permissionResponse.permission as any).rules || [],
        ), // TODO: Need to expose rules on StoredGatorPermissionSanitized in the gator-permissions-controller
      },
    };
  };

  /**
   * Returns the permission details
   * @returns The permission details
   */
  const permissionDetails = useMemo((): PermissionDetails => {
    const { symbol, decimals } = gatorTokenInfo || {};
    switch (permissionType) {
      case 'native-token-stream':
      case 'erc20-token-stream':
        return getTokenStreamPermissionDetails(
          decimals || 0,
          symbol || 'Unknown Token',
          permissionResponse.permission,
        );
      case 'native-token-periodic':
      case 'erc20-token-periodic':
        return getTokenPeriodicPermissionDetails(
          decimals || 0,
          symbol || 'Unknown Token',
          permissionResponse.permission,
        );
      default:
        throw new Error(`Invalid permission type: ${permissionType}`);
    }
  }, [permissionType, permissionResponse]);

  /**
   * Renders the expanded permission details
   * @param expandedPermissionSecondaryDetails - The expanded permission secondary details
   * @returns The expanded permission details
   */
  const renderExpandedPermissionDetails = (
    expandedPermissionSecondaryDetails: PermissionExpandedDetails,
  ) => {
    return (
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
            {t('networks')}
          </Text>
          <Box
            flexDirection={BoxFlexDirection.Row}
            alignItems={BoxAlignItems.Baseline}
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

        {/* Expanded permission secondary details */}
        {Object.entries(expandedPermissionSecondaryDetails).map(
          ([key, value]) => {
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
                  {t(key)}
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
          },
        )}
      </>
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
      <Box>
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
            {t(permissionDetails.amountLabel.translationKey)}
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
              {permissionDetails.amountLabel.value}
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
            {t(permissionDetails.frequencyLabel.translationKey)}
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
              {t(permissionDetails.frequencyLabel.valueTranslationKey)}
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
            {t('account')}
          </Text>
          <Box
            flexDirection={BoxFlexDirection.Row}
            justifyContent={BoxJustifyContent.End}
            style={{ flex: '1', alignSelf: 'center' }}
            gap={2}
            alignItems={BoxAlignItems.Center}
          >
            <PreferredAvatar address={permissionAccount} />
            <Text
              variant={TextVariant.BodyMd}
              color={TextColor.TextAlternative}
            >
              {shortenAddress(permissionAccount)}
            </Text>
          </Box>
        </Box>
      </Box>

      {/* Expand/Collapse view */}
      <Box>
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
        {isExpanded &&
          renderExpandedPermissionDetails(permissionDetails.expandedDetails)}
      </Box>
    </Card>
  );
};
