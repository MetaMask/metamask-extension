import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Hex } from '@metamask/utils';
import {
  Box,
  ButtonIcon,
  ButtonIconSize,
  IconName,
  BoxFlexDirection,
  BoxJustifyContent,
  IconColor,
} from '@metamask/design-system-react';
import { Content, Header, Page } from '../../page';
import {
  BackgroundColor,
  TextVariant as TextVariantLocal,
} from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useTheme } from '../../../../../hooks/useTheme';
import { TabEmptyState } from '../../../../ui/tab-empty-state';
import { ThemeType } from '../../../../../../shared/constants/preferences';
import {
  PREVIOUS_ROUTE,
  REVIEW_GATOR_PERMISSIONS_ROUTE,
} from '../../../../../helpers/constants/routes';
import { PermissionGroupListItem } from '../components';
import {
  AppState,
  getPermissionGroupMetaData,
  getPermissionGroupMetaDataByOrigin,
} from '../../../../../selectors/gator-permissions/gator-permissions';
import { getDisplayOrigin, safeDecodeURIComponent } from '../helper';

export const TokenTransferPage = () => {
  const t = useI18nContext();
  const theme = useTheme();
  const navigate = useNavigate();
  const urlParams = useParams<{ origin?: string }>();
  const origin = urlParams.origin
    ? safeDecodeURIComponent(urlParams.origin)
    : undefined;

  const permissionGroupName = 'token-transfer';

  // Get permissions - filtered by origin if provided, otherwise all
  const permissionGroupMetaData = useSelector((state: AppState) =>
    origin
      ? getPermissionGroupMetaDataByOrigin(state, {
          permissionGroupName,
          siteOrigin: origin,
        })
      : getPermissionGroupMetaData(state, permissionGroupName),
  );

  const handlePermissionGroupItemClick = (chainId: Hex) => {
    const baseRoute = `${REVIEW_GATOR_PERMISSIONS_ROUTE}/${chainId}/${permissionGroupName}`;
    navigate(origin ? `${baseRoute}/${encodeURIComponent(origin)}` : baseRoute);
  };

  const renderPageContent = () =>
    permissionGroupMetaData.map(({ chainId, count }) => {
      const text =
        count === 1
          ? t('tokenPermissionCount', [count])
          : t('tokenPermissionsCount', [count]);
      return (
        <PermissionGroupListItem
          data-testid="permission-group-list-item"
          key={chainId}
          chainId={chainId}
          text={text}
          onClick={() => handlePermissionGroupItemClick(chainId)}
        />
      );
    });

  return (
    <Page
      className="main-container"
      data-testid="token-transfer-page"
      key="token-transfer-page"
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
        textProps={{
          variant: TextVariantLocal.headingMd,
          'data-testid': 'token-transfer-page-title',
        }}
      >
        {origin
          ? `${getDisplayOrigin(origin, false)}: ${t('tokenTransfer')}`
          : t('tokenTransfer')}
      </Header>
      <Content padding={0}>
        {permissionGroupMetaData.length > 0 ? (
          renderPageContent()
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
