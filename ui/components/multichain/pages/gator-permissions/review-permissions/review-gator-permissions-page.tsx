import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom-v5-compat';
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
  TextColor,
  BoxJustifyContent,
  BoxFlexDirection,
} from '@metamask/design-system-react';
import {
  PermissionTypesWithCustom,
  Signer,
  StoredGatorPermissionSanitized,
} from '@metamask/gator-permissions-controller';
import { Content, Header, Page } from '../../page';
import { BackgroundColor } from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
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

type ReviewGatorPermissionsPageProps = {
  params?: { chainId: string; permissionGroupName: string; origin?: string };
  navigate?: (
    to: string | number,
    options?: { replace?: boolean; state?: Record<string, unknown> },
  ) => void;
};

export const ReviewGatorPermissionsPage = ({
  params,
  navigate: navigateProp,
}: ReviewGatorPermissionsPageProps = {}) => {
  const t = useI18nContext();
  const navigateHook = useNavigate();
  const navigate = navigateProp || navigateHook;
  const urlParamsHook = useParams<{
    chainId: string;
    permissionGroupName: string;
    origin?: string;
  }>();

  const { chainId, origin } = params || urlParamsHook;
  const originDecoded = origin ? safeDecodeURIComponent(origin) : undefined;

  const [, evmNetworks] = useSelector(
    getMultichainNetworkConfigurationsByChainId,
  );
  const [totalGatorPermissions, setTotalGatorPermissions] = useState(0);

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

  useEffect(() => {
    setTotalGatorPermissions(gatorPermissions.length);
  }, [chainId, gatorPermissions]);

  const handleRevokeClick = async (
    permission: StoredGatorPermissionSanitized<
      Signer,
      PermissionTypesWithCustom
    >,
  ) => {
    try {
      await revokeGatorPermission(permission);
    } catch (error) {
      console.error('Error revoking gator permission:', error);
    }
  };

  const renderGatorPermissions = (
    permissions: StoredGatorPermissionSanitized<
      Signer,
      PermissionTypesWithCustom
    >[],
  ) =>
    permissions.map((permission) => {
      return (
        <ReviewGatorPermissionItem
          key={`${permission.siteOrigin}-${permission.permissionResponse.context}`}
          networkName={networkName}
          gatorPermission={permission}
          onRevokeClick={() => handleRevokeClick(permission)}
        />
      );
    });

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
        {totalGatorPermissions > 0 ? (
          renderGatorPermissions(gatorPermissions)
        ) : (
          <Box
            data-testid="no-connections"
            flexDirection={BoxFlexDirection.Column}
            justifyContent={BoxJustifyContent.Center}
            gap={2}
            padding={4}
          >
            <Text variant={TextVariant.BodyMd} textAlign={TextAlign.Center}>
              {t('permissionsPageEmptyContent')}
            </Text>
            <Text
              variant={TextVariant.BodyMd}
              color={TextColor.TextAlternative}
              textAlign={TextAlign.Center}
            >
              {t('permissionsPageEmptySubContent')}
            </Text>
          </Box>
        )}
      </Content>
    </Page>
  );
};
