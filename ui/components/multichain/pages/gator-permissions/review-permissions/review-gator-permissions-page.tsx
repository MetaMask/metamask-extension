import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Hex } from '@metamask/utils';
import {
  ButtonIcon,
  ButtonIconSize,
  IconName,
  Text,
  IconColor,
  TextAlign,
  TextVariant,
  Box,
  BoxFlexDirection,
  BoxJustifyContent,
} from '@metamask/design-system-react';
import {
  PermissionTypesWithCustom,
  Signer,
  StoredGatorPermissionSanitized,
} from '@metamask/gator-permissions-controller';
import { Content, Header, Page } from '../../page';
import { BackgroundColor } from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useTheme } from '../../../../../hooks/useTheme';
import { TabEmptyState } from '../../../../ui/tab-empty-state';
import { ThemeType } from '../../../../../../shared/constants/preferences';
import {
  extractNetworkName,
  getDisplayOrigin,
  safeDecodeURIComponent,
} from '../helper';
import { getMultichainNetworkConfigurationsByChainId } from '../../../../../selectors';
import { useRevokeGatorPermissions } from '../../../../../hooks/gator-permissions/useRevokeGatorPermissions';
import {
  AppState,
  getAggregatedGatorPermissionByChainId,
  getAggregatedGatorPermissionByChainIdAndOrigin,
} from '../../../../../selectors/gator-permissions/gator-permissions';
import { ReviewGatorPermissionItem } from '../components';
import { PREVIOUS_ROUTE } from '../../../../../helpers/constants/routes';

export const ReviewGatorPermissionsPage = () => {
  const t = useI18nContext();
  const theme = useTheme();
  const navigate = useNavigate();
  const { chainId, origin } = useParams<{
    chainId: string;
    permissionGroupName: string;
    origin?: string;
  }>();

  const originDecoded = origin ? safeDecodeURIComponent(origin) : undefined;

  const [, evmNetworks] = useSelector(
    getMultichainNetworkConfigurationsByChainId,
  );
  const [pendingRevokeClicks, setPendingRevokeClicks] = useState<Set<string>>(
    new Set(),
  );
  const revokeTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );

  // Cleanup all pending timeouts on unmount
  useEffect(() => {
    const timeouts = revokeTimeoutsRef.current;
    return () => {
      timeouts.forEach((timeout) => clearTimeout(timeout));
      timeouts.clear();
    };
  }, []);

  // Helper functions for managing pending state
  const addPendingContext = useCallback((context: string) => {
    setPendingRevokeClicks((prev) => {
      const next = new Set(prev);
      next.add(context);
      return next;
    });
  }, []);

  const removePendingContext = useCallback((context: string) => {
    setPendingRevokeClicks((prev) => {
      const next = new Set(prev);
      next.delete(context);
      return next;
    });
  }, []);

  const networkName: string = useMemo(() => {
    const networkNameKey = extractNetworkName(evmNetworks, chainId as Hex);
    const networkNameFromTranslation: string = t(networkNameKey);

    // If the translation key doesn't exist (returns the same key), fall back to the full network name
    if (
      !networkNameFromTranslation ||
      networkNameFromTranslation === networkNameKey
    ) {
      return extractNetworkName(evmNetworks, chainId as Hex, true);
    }

    return networkNameFromTranslation;
  }, [chainId, evmNetworks, t]);

  // Get permissions - filtered by origin if provided, otherwise all
  const gatorPermissions = useSelector((state: AppState) =>
    originDecoded
      ? getAggregatedGatorPermissionByChainIdAndOrigin(state, {
          aggregatedPermissionType: 'token-transfer',
          chainId: chainId as Hex,
          siteOrigin: originDecoded,
        })
      : getAggregatedGatorPermissionByChainId(state, {
          aggregatedPermissionType: 'token-transfer',
          chainId: chainId as Hex,
        }),
  );

  const { revokeGatorPermission } = useRevokeGatorPermissions({
    chainId: chainId as Hex,
  });

  const handleRevokeClick = useCallback(
    async (
      permission: StoredGatorPermissionSanitized<
        Signer,
        PermissionTypesWithCustom
      >,
    ) => {
      const { context } = permission.permissionResponse;

      // Set pending state immediately to disable button and show "Pending..." text
      addPendingContext(context);

      try {
        await revokeGatorPermission(permission);

        // Delay clearing to prevent visual flash before transaction window shows
        const timeoutId = setTimeout(() => {
          removePendingContext(context);
          revokeTimeoutsRef.current.delete(context);
        }, 800); // 800ms delay to prevent visual flash before transaction window shows

        revokeTimeoutsRef.current.set(context, timeoutId);
      } catch (error) {
        console.error('Error revoking gator permission:', error);

        // Clean up any pending timeout
        const existingTimeout = revokeTimeoutsRef.current.get(context);
        clearTimeout(existingTimeout);
        revokeTimeoutsRef.current.delete(context);

        // Clear pending state immediately on error
        removePendingContext(context);
      }
    },
    [revokeGatorPermission, addPendingContext, removePendingContext],
  );

  const renderGatorPermissions = (
    permissions: StoredGatorPermissionSanitized<
      Signer,
      PermissionTypesWithCustom
    >[],
  ) =>
    permissions.map((permission) => (
      <ReviewGatorPermissionItem
        key={`${permission.siteOrigin}-${permission.permissionResponse.context}`}
        networkName={networkName}
        gatorPermission={permission}
        onRevokeClick={() => handleRevokeClick(permission)}
        hasRevokeBeenClicked={pendingRevokeClicks.has(
          permission.permissionResponse.context,
        )}
      />
    ));

  return (
    <Page
      className="main-container"
      data-testid="review-gator-permissions-page"
      key="review-gator-permissions-page"
    >
      <Header
        backgroundColor={BackgroundColor.backgroundDefault}
        startAccessory={
          <ButtonIcon
            ariaLabel={t('back')}
            iconName={IconName.ArrowLeft}
            className="connections-header__start-accessory"
            color={IconColor.IconDefault}
            onClick={() => navigate(PREVIOUS_ROUTE)}
            size={ButtonIconSize.Sm}
          />
        }
      >
        <Text
          variant={TextVariant.HeadingMd}
          textAlign={TextAlign.Center}
          data-testid="review-gator-permissions-page-title"
        >
          {origin ? `${getDisplayOrigin(origin)}: ${networkName}` : networkName}
        </Text>
      </Header>
      <Content padding={0}>
        {gatorPermissions.length > 0 ? (
          renderGatorPermissions(gatorPermissions)
        ) : (
          <Box
            data-testid="no-connections"
            flexDirection={BoxFlexDirection.Column}
            justifyContent={BoxJustifyContent.Center}
            className="h-full"
            padding={4}
          >
            <TabEmptyState
              icon={
                <img
                  src={
                    theme === ThemeType.dark
                      ? '/images/empty-state-permissions-dark.png'
                      : '/images/empty-state-permissions-light.png'
                  }
                  alt={t('permissionsPageEmptyDescription')}
                  width={72}
                  height={72}
                />
              }
              description={t('permissionsPageEmptyDescription')}
              className="mx-auto"
            />
          </Box>
        )}
      </Content>
    </Page>
  );
};
