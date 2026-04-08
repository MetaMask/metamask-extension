import React, { useCallback, useMemo } from 'react';
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
import { PermissionInfoWithMetadata } from '@metamask/gator-permissions-controller';
import { Hex } from '@metamask/utils';
import { getImageForChainId } from '../../../../../selectors/multichain';
import { getURLHost, shortenAddress } from '../../../../../helpers/utils/util';
import Card from '../../../../ui/card';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { getInternalAccountByAddress } from '../../../../../selectors';
import { formatDecimalShiftedValue } from '../../../../../../shared/lib/gator-permissions';
import { PERMISSION_SCHEMAS } from '../../../../../../shared/lib/gator-permissions/permission-detail-schemas';
import { PreferredAvatar } from '../../../../app/preferred-avatar';
import { BackgroundColor } from '../../../../../helpers/constants/design-system';
import { getPendingRevocations } from '../../../../../selectors/gator-permissions/gator-permissions';
import { useGatorPermissionTokenInfo } from '../../../../../hooks/gator-permissions/useGatorPermissionTokenInfo';
import { CopyIcon } from '../../../../app/confirm/info/row/copy-icon';
import { useBoolean } from '../../../../../hooks/useBoolean';
import {
  GatorPermissionDetailRow,
  gatorPermissionDetailRowStyle,
} from './gator-permission-detail-row';
import { ReviewPermissionRenderer } from './review-permission-renderer';

/**
 * Permission `data` for the shared schema renderer (single assertion at the boundary).
 *
 * @param permission - Gator permission whose `data` is passed into `PERMISSION_SCHEMAS`.
 * @param permission.data - Raw permission payload; coerced to a plain object for the schema.
 */
function permissionDataForReview(permission: {
  data: unknown;
}): Record<string, unknown> {
  if (
    permission.data !== null &&
    typeof permission.data === 'object' &&
    !Array.isArray(permission.data)
  ) {
    return permission.data as Record<string, unknown>;
  }
  return {};
}

type ReviewGatorPermissionItemProps = {
  /**
   * The network name to display
   */
  networkName: string;

  /**
   * The gator permission to display
   */
  gatorPermission: PermissionInfoWithMetadata;

  /**
   * The function to call when the revoke is clicked
   */
  onRevokeClick: () => void;

  /**
   * Whether this permission has a pending revoke click (temporary UI state)
   */
  hasRevokeBeenClicked?: boolean;
};

export const ReviewGatorPermissionItem = ({
  networkName,
  gatorPermission,
  onRevokeClick,
  hasRevokeBeenClicked = false,
}: ReviewGatorPermissionItemProps) => {
  const t = useI18nContext();

  const { permissionResponse, siteOrigin } = gatorPermission;
  const {
    chainId,
    permission: {
      type: permissionType,
      data: { justification, tokenAddress },
    },
    context: permissionContext,
    from: permissionAccount = '0x',
  } = permissionResponse;

  const { value: isExpanded, toggle } = useBoolean();
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

  const schemaEntry = PERMISSION_SCHEMAS[permissionType];
  const summary = schemaEntry?.summary;

  const summaryCtx = useMemo(
    () => ({
      permission: {
        type: permissionType,
        data: permissionDataForReview(permissionResponse.permission),
      },
      expiry: null as number | null,
      chainId,
      origin: '',
      tokenInfo: {
        symbol: tokenMetadata.symbol,
        decimals: tokenMetadata.decimals,
      },
    }),
    [permissionType, permissionResponse.permission, chainId, tokenMetadata],
  );

  const formatHexValue = useCallback(
    (value: Hex | null | undefined, placeholder: string = 'Unknown') => {
      if (!value) {
        return placeholder;
      }
      const { symbol, decimals } = tokenMetadata;
      const formattedValueWithSymbol = `${formatDecimalShiftedValue(value, decimals)} ${symbol}`;
      if (typeof decimals === 'number') {
        return formattedValueWithSymbol;
      }
      return `${formattedValueWithSymbol} (raw units)`;
    },
    [tokenMetadata],
  );

  const summaryAmountValue = useMemo(() => {
    if (!summary) {
      return '';
    }
    if ('getHexValue' in summary.amount) {
      return formatHexValue(summary.amount.getHexValue(summaryCtx));
    }
    const i18nVal = summary.amount.getI18nValue(summaryCtx);
    return t(i18nVal.key, i18nVal.args);
  }, [summary, summaryCtx, formatHexValue, t]);

  const summaryFrequencyValueKey = useMemo(() => {
    return summary?.frequency?.getValueKey(summaryCtx) ?? '';
  }, [summary, summaryCtx]);

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
        {summary && (
          <GatorPermissionDetailRow
            label={t(summary.amount.labelKey)}
            value={summaryAmountValue}
            testId={summary.amount.testId}
            isLoading={loading}
          />
        )}
        {summary?.frequency && (
          <GatorPermissionDetailRow
            label={t(summary.frequency.labelKey)}
            value={t(summaryFrequencyValueKey)}
            testId={summary.frequency.testId}
          />
        )}
        {/* Account row - custom layout with avatar and copy icon */}
        <Box
          flexDirection={BoxFlexDirection.Row}
          justifyContent={BoxJustifyContent.Between}
          style={gatorPermissionDetailRowStyle}
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
            style={gatorPermissionDetailRowStyle}
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
            onClick={toggle}
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
              ariaLabel="expand"
            />
          </Box>
        </Box>

        {isExpanded && (
          <>
            {justification && (
              <GatorPermissionDetailRow
                label={t('gatorPermissionsJustification')}
                value={justification}
                testId="review-gator-permission-justification"
              />
            )}

            {/* Network name row - custom layout with avatar */}
            <Box
              flexDirection={BoxFlexDirection.Row}
              justifyContent={BoxJustifyContent.Between}
              style={gatorPermissionDetailRowStyle}
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
                style={gatorPermissionDetailRowStyle}
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

            <ReviewPermissionRenderer
              permissionType={permissionType}
              permissionData={permissionDataForReview(
                permissionResponse.permission,
              )}
              chainId={chainId}
              expiry={null}
              rules={permissionResponse.rules}
              tokenInfo={tokenMetadata}
              tokenLoading={loading}
            />
          </>
        )}
      </Box>
    </Card>
  );
};
