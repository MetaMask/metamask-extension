import React, { useEffect, useMemo, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
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
import { extractNetworkName } from '../helper';
import { getMultichainNetworkConfigurationsByChainId } from '../../../../../selectors';
import { useRevokeGatorPermissions } from '../../../../../hooks/gator-permissions/useRevokeGatorPermissions';
import {
  AppState,
  getAggregatedGatorPermissionByChainId,
} from '../../../../../selectors/gator-permissions/gator-permissions';
import { ReviewGatorPermissionItem } from '../components';

export const ReviewGatorPermissionsPage = () => {
  const t = useI18nContext();
  const history = useHistory();
  const { chainId } = useParams();
  const [, evmNetworks] = useSelector(
    getMultichainNetworkConfigurationsByChainId,
  );
  const [totalGatorPermissions, setTotalGatorPermissions] = useState(0);

  const networkName: string = useMemo(() => {
    if (!chainId) {
      return t('unknownNetworkForGatorPermissions');
    }
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

  const gatorPermissions = useSelector((state: AppState) =>
    getAggregatedGatorPermissionByChainId(state, {
      aggregatedPermissionType: 'token-transfer',
      chainId: chainId as Hex,
    }),
  );

  const { revokeGatorPermission } = useRevokeGatorPermissions({
    chainId: (chainId ?? '') as Hex,
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
            onClick={() => history.goBack()}
            size={ButtonIconSize.Sm}
          />
        }
      >
        <Text
          variant={TextVariant.HeadingMd}
          textAlign={TextAlign.Center}
          data-testid="review-gator-permissions-page-title"
        >
          {networkName}
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
