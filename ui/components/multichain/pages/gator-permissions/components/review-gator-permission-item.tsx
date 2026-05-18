import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
  BoxFlexDirection,
  IconColor,
  BoxJustifyContent,
  TextColor,
  TextVariant,
  BoxBackgroundColor,
  Box,
  Text,
  ButtonIcon,
  ButtonIconSize,
  IconName,
  Button,
} from '@metamask/design-system-react';
import {
  GatorPermissionStatus,
  PermissionInfoWithMetadata,
} from '@metamask/gator-permissions-controller';
import { getURLHost } from '../../../../../helpers/utils/util';
import Card from '../../../../ui/card';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import {
  BackgroundColor,
  TextColor as DesignSystemTextColor,
} from '../../../../../helpers/constants/design-system';
import { getPendingRevocations } from '../../../../../selectors/gator-permissions/gator-permissions';
import { useGatorPermissionTokenInfo } from '../../../../../hooks/gator-permissions/useGatorPermissionTokenInfo';
import { useBoolean } from '../../../../../hooks/useBoolean';
import { Tag } from '../../../../component-library';
import { ReviewPermissionRenderer } from './review-permission-renderer';

/**
 * Permission `data` for the shared schema renderer.
 * Schema validation runs in `ReviewPermissionRenderer`.
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

type InactivePermissionStatusTag = {
  label: string;
  backgroundColor: BackgroundColor;
  labelColor: TextColor;
};

function getInactivePermissionStatusTag(
  permissionStatus: GatorPermissionStatus,
  translate: ReturnType<typeof useI18nContext>,
): InactivePermissionStatusTag | null {
  switch (permissionStatus) {
    case 'Active':
      return null;
    case 'Expired':
      return {
        label: translate('gatorPermissionsStatusExpired'),
        backgroundColor: BackgroundColor.warningMuted,
        labelColor: TextColor.WarningDefault,
      };
    case 'Revoked':
      return {
        label: translate('gatorPermissionsStatusRevoked'),
        backgroundColor: BackgroundColor.errorMuted,
        labelColor: TextColor.ErrorDefault,
      };
    default: {
      throw new Error(
        `Unexpected gator permission status: ${String(permissionStatus)}`,
      );
    }
  }
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

  const { permissionResponse, siteOrigin, status } = gatorPermission;
  const {
    chainId,
    permission: {
      type: permissionType,
      data: { tokenAddress },
    },
    context: permissionContext,
    from: permissionAccount = '0x',
  } = permissionResponse;

  const { value: isExpanded, toggle } = useBoolean();
  const pendingRevocations = useSelector(getPendingRevocations);

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

  const revokeButtonLabel = useMemo(() => {
    if (isPendingRevocation) {
      return t('gatorPermissionsRevocationPending');
    }
    if (status === 'Revoked') {
      return t('remove');
    }
    return t('gatorPermissionsRevoke');
  }, [isPendingRevocation, status, t]);

  const permissionData = useMemo(
    () => permissionDataForReview(permissionResponse.permission),
    [permissionResponse.permission],
  );

  const statusTag = getInactivePermissionStatusTag(status, t);

  const commonRendererProps = useMemo(
    () => ({
      permissionType,
      permissionData,
      chainId,
      rules: permissionResponse.rules,
      tokenInfo: tokenMetadata,
      tokenLoading: loading,
      permissionAccount,
      networkName,
    }),
    [
      permissionType,
      permissionData,
      chainId,
      permissionResponse.rules,
      tokenMetadata,
      loading,
      permissionAccount,
      networkName,
    ],
  );

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
          gap={2}
          style={{ alignItems: 'center' }}
        >
          <Box
            flexDirection={BoxFlexDirection.Row}
            gap={2}
            style={{
              flex: 1,
              minWidth: 0,
              alignItems: 'center',
            }}
          >
            <Text variant={TextVariant.BodyMd} ellipsis style={{ minWidth: 0 }}>
              {getURLHost(siteOrigin)}
            </Text>
            {statusTag ? (
              <Tag
                data-testid="review-gator-permission-status-tag"
                label={statusTag.label}
                backgroundColor={statusTag.backgroundColor}
                labelProps={{
                  color: statusTag.labelColor as DesignSystemTextColor,
                }}
                textVariant={TextVariant.BodySm}
                style={{ flexShrink: 0 }}
              />
            ) : null}
          </Box>
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
              {revokeButtonLabel}
            </Text>
          </Button>
        </Box>
      </Box>

      {/* Summary: always visible, schema-driven */}
      <Box backgroundColor={BoxBackgroundColor.BackgroundDefault}>
        <ReviewPermissionRenderer
          {...commonRendererProps}
          viewMode="reviewSummary"
        />
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
          <ReviewPermissionRenderer
            {...commonRendererProps}
            viewMode="reviewDetail"
          />
        )}
      </Box>
    </Card>
  );
};
