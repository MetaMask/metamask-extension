import React, { useCallback, useMemo, useState } from 'react';
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
  Button,
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
  convertAmountPerSecondToAmountPerPeriod,
  getDecimalizedHexValue,
} from '../../../../../../shared/lib/gator-permissions';
import { PreferredAvatar } from '../../../../app/preferred-avatar';
import { BackgroundColor } from '../../../../../helpers/constants/design-system';
import {
  getNativeTokenInfo,
  selectERC20TokensByChain,
} from '../../../../../selectors/selectors';
import { getTokenMetadata } from '../../../../../helpers/utils/token-util';
import { getPendingRevocations } from '../../../../../selectors/gator-permissions/gator-permissions';

type TokenMetadata = {
  symbol: string;
  decimals: number | null;
  name: string;
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

  /**
   * Whether this permission has a pending revoke click (temporary UI state)
   */
  hasRevokeBeenClicked?: boolean;
};

type PermissionExpandedDetails = Record<
  string,
  {
    translationKey: string;
    value: string;
    testId: string;
  }
>;

type PermissionDetails = {
  amountLabel: {
    translationKey: string;
    value: string;
    testId: string;
  };
  frequencyLabel: {
    translationKey: string;
    valueTranslationKey: string;
    testId: string;
  };
  expandedDetails: PermissionExpandedDetails;
};

export const ReviewGatorPermissionItem = ({
  networkName,
  gatorPermission,
  onRevokeClick,
  hasRevokeBeenClicked = false,
}: ReviewGatorPermissionItemProps) => {
  const t = useI18nContext();
  const { permissionResponse, siteOrigin } = gatorPermission;
  const { chainId } = permissionResponse;
  const permissionType = permissionResponse.permission.type;
  const permissionContext = permissionResponse.context;
  const permissionAccount = permissionResponse.address || '0x';
  const tokenAddress = permissionResponse.permission.data.tokenAddress as
    | Hex
    | undefined;

  const [isExpanded, setIsExpanded] = useState(false);
  const tokensByChain = useSelector(selectERC20TokensByChain);
  const nativeTokenMetadata = useSelector((state) =>
    getNativeTokenInfo(state, chainId),
  ) as TokenMetadata;
  const pendingRevocations = useSelector(getPendingRevocations);

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
          name: foundTokenMetadata.name || 'Unknown Token',
        };
      }
      console.warn(
        `Token metadata not found for address: ${tokenAddress} for chain: ${chainId}`,
      );
      return {
        symbol: 'Unknown Token',
        decimals: null,
        name: 'Unknown Token',
      };
    }
    return {
      symbol: nativeTokenMetadata.symbol,
      decimals: nativeTokenMetadata.decimals,
      name: nativeTokenMetadata.name,
    };
  }, [tokensByChain, chainId, tokenAddress, nativeTokenMetadata]);

  const isPendingRevocation = useMemo(() => {
    return (
      hasRevokeBeenClicked ||
      pendingRevocations.some(
        (revocation) => revocation.permissionContext === permissionContext,
      )
    );
  }, [pendingRevocations, permissionContext, hasRevokeBeenClicked]);

  /**
   * Handles the click event for the expand/collapse button
   */
  const handleExpandClick = () => {
    setIsExpanded(!isExpanded);
  };

  /**
   * Returns the expiration date from the rules
   *
   * @param rules - The rules to extract the expiration from
   * @returns The expiration date
   */
  const getExpirationDate = useCallback(
    (rules: GatorPermissionRule[]): string => {
      if (!rules) {
        return t('gatorPermissionNoExpiration');
      }
      if (rules.length === 0) {
        return t('gatorPermissionNoExpiration');
      }
      return extractExpiryToReadableDate(rules);
    },
    [t],
  );

  /**
   * Returns the token stream permission details
   *
   * @param permission - The stream permission data
   * @returns The permission details
   */
  const getTokenStreamPermissionDetails = useCallback(
    (
      permission: NativeTokenStreamPermission | Erc20TokenStreamPermission,
    ): PermissionDetails => {
      const { symbol, decimals } = tokenMetadata;
      const amountPerPeriod = convertAmountPerSecondToAmountPerPeriod(
        permission.data.amountPerSecond,
        'weekly',
      );
      return {
        amountLabel: {
          translationKey: 'gatorPermissionsStreamingAmountLabel',
          value:
            decimals === null
              ? t('gatorPermissionUnknownTokenAmount')
              : `${getDecimalizedHexValue(amountPerPeriod, decimals)} ${symbol}`,
          testId: 'review-gator-permission-amount-label',
        },
        frequencyLabel: {
          translationKey: 'gatorPermissionTokenStreamFrequencyLabel',
          valueTranslationKey: 'gatorPermissionWeeklyFrequency',
          testId: 'review-gator-permission-frequency-label',
        },
        expandedDetails: {
          initialAllowance: {
            translationKey: 'gatorPermissionsInitialAllowance',
            value:
              decimals === null
                ? t('gatorPermissionUnknownTokenAmount')
                : `${getDecimalizedHexValue(
                    permission.data.initialAmount || '0x0',
                    decimals,
                  )} ${symbol}`,
            testId: 'review-gator-permission-initial-allowance',
          },
          maxAllowance: {
            translationKey: 'gatorPermissionsMaxAllowance',
            value:
              decimals === null
                ? t('gatorPermissionUnknownTokenAmount')
                : `${getDecimalizedHexValue(
                    permission.data.maxAmount || '0x0',
                    decimals,
                  )} ${symbol}`,
            testId: 'review-gator-permission-max-allowance',
          },
          startDate: {
            translationKey: 'gatorPermissionsStartDate',
            value: convertTimestampToReadableDate(
              permission.data.startTime as number,
            ),
            testId: 'review-gator-permission-start-date',
          },

          // TODO: Need to expose rules on StoredGatorPermissionSanitized in the gator-permissions-controller so we can have stronger typing
          expirationDate: {
            translationKey: 'gatorPermissionsExpirationDate',
            value: getExpirationDate(
              (permission as unknown as { rules: GatorPermissionRule[] }).rules,
            ),
            testId: 'review-gator-permission-expiration-date',
          },
          streamRate: {
            translationKey: 'gatorPermissionsStreamRate',
            value:
              decimals === null
                ? t('gatorPermissionUnknownTokenAmount')
                : `${getDecimalizedHexValue(
                    permission.data.amountPerSecond,
                    decimals,
                  )} ${symbol}/sec`,
            testId: 'review-gator-permission-stream-rate',
          },
        },
      };
    },
    [tokenMetadata, t, getExpirationDate],
  );

  /**
   * Returns the token periodic permission details
   *
   * @param permission - The periodic permission data
   * @returns The permission details
   */
  const getTokenPeriodicPermissionDetails = useCallback(
    (
      permission: NativeTokenPeriodicPermission | Erc20TokenPeriodicPermission,
    ): PermissionDetails => {
      const { symbol, decimals } = tokenMetadata;
      return {
        amountLabel: {
          translationKey: 'amount',
          value:
            decimals === null
              ? t('gatorPermissionUnknownTokenAmount')
              : `${getDecimalizedHexValue(
                  permission.data.periodAmount,
                  decimals,
                )} ${symbol}`,
          testId: 'review-gator-permission-amount-label',
        },
        frequencyLabel: {
          translationKey: 'gatorPermissionTokenPeriodicFrequencyLabel',
          valueTranslationKey: getPeriodFrequencyValueTranslationKey(
            permission.data.periodDuration,
          ),
          testId: 'review-gator-permission-frequency-label',
        },
        expandedDetails: {
          startDate: {
            translationKey: 'gatorPermissionsStartDate',
            value: convertTimestampToReadableDate(
              permission.data.startTime ?? 0,
            ),
            testId: 'review-gator-permission-start-date',
          },

          // TODO: Need to expose rules on StoredGatorPermissionSanitized in the gator-permissions-controller so we can have stronger typing
          expirationDate: {
            translationKey: 'gatorPermissionsExpirationDate',
            value: getExpirationDate(
              (permission as unknown as { rules: GatorPermissionRule[] }).rules,
            ),
            testId: 'review-gator-permission-expiration-date',
          },
        },
      };
    },
    [tokenMetadata, t, getExpirationDate],
  );

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
  }, [
    permissionType,
    getTokenStreamPermissionDetails,
    permissionResponse.permission,
    getTokenPeriodicPermissionDetails,
  ]);

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
          <Button
            onClick={onRevokeClick}
            disabled={isPendingRevocation}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              padding: 0,
            }}
          >
            <Text
              color={
                isPendingRevocation
                  ? TextColor.TextMuted
                  : TextColor.ErrorDefault
              }
              variant={TextVariant.BodyMd}
            >
              {isPendingRevocation
                ? t('gatorPermissionsRevocationPending')
                : t('gatorPermissionsRevoke')}
            </Text>
          </Button>
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
              data-testid={permissionDetails.amountLabel.testId}
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
              data-testid={permissionDetails.frequencyLabel.testId}
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
                  data-testid="review-gator-permission-network-name"
                >
                  {networkName}
                </Text>
              </Box>
            </Box>

            {Object.entries(permissionDetails.expandedDetails).map(
              ([key, detail]) => {
                return (
                  <Box
                    key={key}
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
                      {t(detail.translationKey)}
                    </Text>
                    <Text
                      textAlign={TextAlign.Right}
                      color={TextColor.TextAlternative}
                      variant={TextVariant.BodyMd}
                      data-testid={detail.testId}
                    >
                      {detail.value}
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
