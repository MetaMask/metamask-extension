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
import { PermissionInfoWithMetadata } from '@metamask/gator-permissions-controller';
import { getURLHost } from '../../../../../helpers/utils/util';
import Card from '../../../../ui/card';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { BackgroundColor } from '../../../../../helpers/constants/design-system';
import { getPendingRevocations } from '../../../../../selectors/gator-permissions/gator-permissions';
import { useGatorPermissionTokenInfo } from '../../../../../hooks/gator-permissions/useGatorPermissionTokenInfo';
import { useBoolean } from '../../../../../hooks/useBoolean';
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

  const permissionData = useMemo(
    () => permissionDataForReview(permissionResponse.permission),
    [permissionResponse.permission],
  );

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
          style={{ flex: '1', alignSelf: 'center' }}
          gap={2}
        >
          <Text variant={TextVariant.BodyMd} ellipsis>
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
