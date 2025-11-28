import React from 'react';
import { useNavigate, useParams } from 'react-router-dom-v5-compat';
import { useSelector } from 'react-redux';
import { Hex } from '@metamask/utils';
import {
  Box,
  ButtonIcon,
  ButtonIconSize,
  IconName,
  Text,
  TextAlign,
  TextVariant,
  BoxFlexDirection,
  BoxJustifyContent,
  TextColor,
  IconColor,
} from '@metamask/design-system-react';
import { Content, Header, Page } from '../../page';
import {
  BackgroundColor,
  TextVariant as TextVariantLocal,
} from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
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

type TokenTransferPageProps = {
  params?: { origin?: string };
  navigate?: (
    to: string | number,
    options?: { replace?: boolean; state?: Record<string, unknown> },
  ) => void;
};

export const TokenTransferPage = ({
  params,
  navigate: navigateProp,
}: TokenTransferPageProps = {}) => {
  const t = useI18nContext();
  const navigateHook = useNavigate();
  const navigate = (navigateProp || navigateHook) as NonNullable<
    typeof navigateProp
  >;
  const urlParamsHook = useParams<{ origin?: string }>();
  const urlParams = params || urlParamsHook;
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
