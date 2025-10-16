import React, { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Hex } from '@metamask/utils';
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
  GatorPermissionRule,
} from '../../../../../../shared/lib/gator-permissions';
import { PreferredAvatar } from '../../../../app/preferred-avatar';
import { BackgroundColor } from '../../../../../helpers/constants/design-system';
import { Numeric } from '../../../../../../shared/modules/Numeric';
import {
  getNativeTokenInfo,
  selectERC20TokensByChain,
} from '../../../../../selectors/selectors';
import { getTokenMetadata } from '../../../../../helpers/utils/token-util';

type TokenMetadata = {
  symbol: string;
  decimals: number;
};

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
  const [chainId] = permissionResponse.chainId;
  const permissionType = permissionResponse.permission.type;
  const permissionAccount = permissionResponse.address || '0x';
  const tokenAddress = permissionResponse.permission.data.tokenAddress as
    | Hex
    | undefined;

  const [isExpanded, setIsExpanded] = useState(false);
  const tokensByChain = useSelector(selectERC20TokensByChain);
  const nativeTokenMetadata = useSelector((state) =>
    getNativeTokenInfo(state, chainId),
  ) as TokenMetadata;

  const tokenMetadata: TokenMetadata = useMemo(() => {
    if (tokenAddress) {
      const tokenListForChain = tokensByChain?.[chainId]?.data || {};
      const foundTokenMetadata = getTokenMetadata(
        tokenAddress,
        tokenListForChain,
      );
      if (foundTokenMetadata) {
        return {
          symbol: foundTokenMetadata.symbol || 'Unknown Token',
          decimals: foundTokenMetadata.decimals || 18,
        };
      }
      console.warn(
        `Token metadata not found for address: ${tokenAddress} for chain: ${chainId}`,
      );
      return {
        symbol: 'Unknown Token',
        decimals: 18,
      };
    }
    return {
      symbol: nativeTokenMetadata.symbol,
      decimals: nativeTokenMetadata.decimals,
    };
  }, [tokensByChain, chainId, tokenAddress, nativeTokenMetadata]);

  /**
   * Handles the click event for the expand/collapse button
   */
  const handleExpandClick = () => {
    setIsExpanded(!isExpanded);
  };

  /**
   * Converts a hex value to a decimal value
   *
   * @param value - The hex value to convert
   * @param decimals - The number of decimals to shift the value by
   * @returns The decimal value
   */
  const getDecimalizedHexValue = (value: Hex, decimals: number) =>
    new Numeric(value, 16).toBase(10).shiftedBy(decimals).toString();

  /**
   * Returns the expiration date from the rules
   *
   * @param rules - The rules to extract the expiration from
   * @returns The expiration date
   */
  const getExpirationDate = (rules: GatorPermissionRule[]): string => {
    // TODO: Need to expose rules on StoredGatorPermissionSanitized in the gator-permissions-controller so we can have stronger typing
    if (!rules) {
      return t('gatorPermissionNoExpiration');
    }
    if (rules.length === 0) {
      return t('gatorPermissionNoExpiration');
    }
    return extractExpiryToReadableDate(rules);
  };

  /**
   * Returns the token stream permission details
   *
   * @param permission - The stream permission data
   * @returns The permission details
   */
  const getTokenStreamPermissionDetails = (
    permission: NativeTokenStreamPermission | Erc20TokenStreamPermission,
  ): PermissionDetails => {
    const { symbol, decimals } = tokenMetadata;
    return {
      amountLabel: {
        translationKey: 'gatorPermissionsStreamingAmountLabel',
        value: `${getDecimalizedHexValue(
          permission.data.amountPerSecond,
          decimals,
        )} ${symbol}`,
      },
      frequencyLabel: {
        translationKey: 'gatorPermissionTokenStreamFrequencyLabel',
        valueTranslationKey: 'gatorPermissionWeeklyFrequency',
      },
      expandedDetails: {
        gatorPermissionsInitialAllowance: `${getDecimalizedHexValue(
          permission.data.initialAmount || '0x0',
          decimals,
        )} ${symbol}`,
        gatorPermissionsMaxAllowance: `${getDecimalizedHexValue(
          permission.data.maxAmount || '0x0',
          decimals,
        )} ${symbol}`,
        gatorPermissionsStartDate: convertTimestampToReadableDate(
          permission.data.startTime as number,
        ),
        gatorPermissionsExpirationDate: getExpirationDate(
          (permission as unknown as { rules: GatorPermissionRule[] }).rules,
        ),
        gatorPermissionsStreamRate: `${getDecimalizedHexValue(
          permission.data.amountPerSecond,
          decimals,
        )} ${symbol}/sec`,
      },
    };
  };

  /**
   * Returns the token periodic permission details
   *
   * @param permission - The periodic permission data
   * @returns The permission details
   */
  const getTokenPeriodicPermissionDetails = (
    permission: NativeTokenPeriodicPermission | Erc20TokenPeriodicPermission,
  ): PermissionDetails => {
    const { symbol, decimals } = tokenMetadata;
    return {
      amountLabel: {
        translationKey: 'amount',
        value: `${getDecimalizedHexValue(
          permission.data.periodAmount,
          decimals,
        )} ${symbol}`,
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
        gatorPermissionsExpirationDate: getExpirationDate(
          (permission as unknown as { rules: GatorPermissionRule[] }).rules,
        ),
      },
    };
  };

  /**
   * Returns the permission details
   *
   * @returns The permission details
   */
  const permissionDetails = useMemo((): PermissionDetails => {
    switch (permissionType) {
      case 'native-token-stream':
      case 'erc20-token-stream':
        return getTokenStreamPermissionDetails(permissionResponse.permission);
      case 'native-token-periodic':
      case 'erc20-token-periodic':
        return getTokenPeriodicPermissionDetails(permissionResponse.permission);
      default:
        throw new Error(`Invalid permission type: ${permissionType}`);
    }
  }, [permissionType, permissionResponse, tokenMetadata]);

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

      {/* Permission details */}
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

      {/* Expanded permission details */}
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
                  src={getImageForChainId(chainId)}
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

            {Object.entries(permissionDetails.expandedDetails).map(
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
        )}
      </Box>
    </Card>
  );
};
