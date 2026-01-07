import React, { useCallback, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
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
import { getInternalAccountByAddress } from '../../../../../selectors/selectors';
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
import { getPendingRevocations } from '../../../../../selectors/gator-permissions/gator-permissions';
import { useGatorPermissionTokenInfo } from '../../../../../hooks/gator-permissions/useGatorPermissionTokenInfo';
import { CopyIcon } from '../../../../app/confirm/info/row/copy-icon';
import { Skeleton } from '../../../../component-library/skeleton';

// Shared row style for permission details
const rowStyle = { flex: '1', alignSelf: 'center' } as const;

type PermissionDetailRowProps = {
  label: string;
  value: React.ReactNode;
  testId?: string;
  isLoading?: boolean;
};

/**
 * Reusable row component for permission details
 *
 * @param options - The component options
 * @param options.label - The label text to display
 * @param options.value - The value to display
 * @param options.testId - Optional test ID for the value element
 * @param options.isLoading - Whether to show a loading skeleton
 * @returns The permission detail row component
 */
const PermissionDetailRow = ({
  label,
  value,
  testId,
  isLoading = false,
}: PermissionDetailRowProps): JSX.Element => {
  return (
    <Box
      flexDirection={BoxFlexDirection.Row}
      justifyContent={BoxJustifyContent.Between}
      style={rowStyle}
      gap={4}
      marginTop={2}
    >
      <Text
        textAlign={TextAlign.Left}
        color={TextColor.TextAlternative}
        variant={TextVariant.BodyMd}
      >
        {label}
      </Text>
      <Box
        flexDirection={BoxFlexDirection.Row}
        justifyContent={BoxJustifyContent.End}
        style={rowStyle}
        gap={2}
        alignItems={BoxAlignItems.Center}
      >
        <Skeleton isLoading={isLoading} width="100px" height="16px">
          <Text
            variant={TextVariant.BodyMd}
            color={TextColor.TextAlternative}
            textAlign={TextAlign.Right}
            data-testid={testId}
          >
            {value}
          </Text>
        </Skeleton>
      </Box>
    </Box>
  );
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
  const {
    permission: { type: permissionType, data },
    context: permissionContext,
    address: permissionAccount = '0x',
  } = permissionResponse;
  const { justification, tokenAddress } = data;

  const [isExpanded, setIsExpanded] = useState(false);
  const pendingRevocations = useSelector(getPendingRevocations);
  const internalAccount = useSelector((state) =>
    getInternalAccountByAddress(state, permissionAccount),
  );

  const accountText = useMemo(() => {
    return internalAccount?.metadata?.name || shortenAddress(permissionAccount);
  }, [internalAccount, permissionAccount]);

  // Use the hook to fetch token information (handles both native and ERC-20 tokens)
  const { tokenInfo: tokenMetadata, loading } = useGatorPermissionTokenInfo(
    tokenAddress,
    chainId,
    permissionType,
  );

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
   */
  const getExpirationDate = useCallback(
    (rules: GatorPermissionRule[]): string => {
      if (!rules?.length) {
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
          value: `${getDecimalizedHexValue(amountPerPeriod, decimals)} ${symbol}`,
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
            value: `${getDecimalizedHexValue(
              permission.data.initialAmount || '0x0',
              decimals,
            )} ${symbol}`,
            testId: 'review-gator-permission-initial-allowance',
          },
          maxAllowance: {
            translationKey: 'gatorPermissionsMaxAllowance',
            value: permission.data.maxAmount
              ? `${getDecimalizedHexValue(
                  permission.data.maxAmount,
                  decimals,
                )} ${symbol}`
              : t('unlimited'),
            testId: 'review-gator-permission-max-allowance',
          },
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
          streamRate: {
            translationKey: 'gatorPermissionsStreamRate',
            value: `${getDecimalizedHexValue(
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
          value: `${getDecimalizedHexValue(
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
    [tokenMetadata, getExpirationDate],
  );

  /**
   * Returns the token revocation permission details
   *
   * @returns The permission details for erc20-token-revocation
   */
  const getTokenRevocationPermissionDetails =
    useCallback((): PermissionDetails => {
      return {
        amountLabel: {
          translationKey: 'revokeTokenApprovals',
          value: t('allTokens'),
          testId: 'review-gator-permission-amount-label',
        },
        frequencyLabel: {
          translationKey: '',
          valueTranslationKey: '',
          testId: 'review-gator-permission-frequency-label',
        },
        expandedDetails: {
          expirationDate: {
            translationKey: 'gatorPermissionsExpirationDate',
            value: getExpirationDate(
              (
                permissionResponse.permission as unknown as {
                  rules: GatorPermissionRule[];
                }
              ).rules,
            ),
            testId: 'review-gator-permission-expiration-date',
          },
        },
      };
    }, [t, getExpirationDate, permissionResponse.permission]);

  /**
   * Returns the permission details
   *
   * @returns The permission details
   */
  const permissionDetails = useMemo((): PermissionDetails => {
    switch (permissionType) {
      case 'native-token-stream':
      case 'erc20-token-stream':
        return getTokenStreamPermissionDetails(
          permissionResponse.permission as Erc20TokenStreamPermission,
        );
      case 'native-token-periodic':
      case 'erc20-token-periodic':
        return getTokenPeriodicPermissionDetails(
          permissionResponse.permission as Erc20TokenPeriodicPermission,
        );
      case 'erc20-token-revocation':
        return getTokenRevocationPermissionDetails();
      default:
        throw new Error(`Invalid permission type: ${permissionType}`);
    }
  }, [
    permissionType,
    getTokenStreamPermissionDetails,
    permissionResponse.permission,
    getTokenPeriodicPermissionDetails,
    getTokenRevocationPermissionDetails,
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
        <PermissionDetailRow
          label={t(permissionDetails.amountLabel.translationKey)}
          value={permissionDetails.amountLabel.value}
          testId={permissionDetails.amountLabel.testId}
          isLoading={loading}
        />
        {permissionDetails.frequencyLabel.translationKey && (
          <PermissionDetailRow
            label={t(permissionDetails.frequencyLabel.translationKey)}
            value={t(permissionDetails.frequencyLabel.valueTranslationKey)}
            testId={permissionDetails.frequencyLabel.testId}
          />
        )}
        {/* Account row - custom layout with avatar and copy icon */}
        <Box
          flexDirection={BoxFlexDirection.Row}
          justifyContent={BoxJustifyContent.Between}
          style={rowStyle}
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
            style={rowStyle}
            gap={2}
            alignItems={BoxAlignItems.Center}
          >
            <PreferredAvatar address={permissionAccount} />
            <Text
              variant={TextVariant.BodyMd}
              color={TextColor.TextAlternative}
              data-testid="review-gator-permission-account-name"
            >
              {accountText}
            </Text>
            <CopyIcon
              copyText={permissionAccount}
              style={{ position: 'static', right: 'auto', top: 'auto' }}
            />
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
              {isExpanded
                ? t('gatorPermissionsHideDetails')
                : t('gatorPermissionsShowDetails')}
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
            {justification && (
              <PermissionDetailRow
                label={t('gatorPermissionsJustification')}
                value={justification}
                testId="review-gator-permission-justification"
              />
            )}

            {/* Network name row - custom layout with avatar */}
            <Box
              flexDirection={BoxFlexDirection.Row}
              justifyContent={BoxJustifyContent.Between}
              style={rowStyle}
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
                style={rowStyle}
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
                const isLoadingValue =
                  loading &&
                  ['initialAllowance', 'maxAllowance', 'streamRate'].includes(
                    key,
                  );
                return (
                  <PermissionDetailRow
                    key={key}
                    label={t(detail.translationKey)}
                    value={detail.value}
                    testId={detail.testId}
                    isLoading={isLoadingValue}
                  />
                );
              },
            )}
          </>
        )}
      </Box>
    </Card>
  );
};
