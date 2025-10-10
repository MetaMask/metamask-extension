import React from 'react';
import { useHistory } from 'react-router-dom';
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
import { BackgroundColor } from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import {
  GATOR_PERMISSIONS,
  REVIEW_GATOR_PERMISSIONS_ROUTE,
} from '../../../../../helpers/constants/routes';
import { PermissionGroupListItem } from '../components';
import {
  AppState,
  getPermissionGroupDetails,
} from '../../../../../selectors/gator-permissions/gator-permissions';

export const TokenTransferPage = () => {
  const t = useI18nContext();
  const history = useHistory();
  const permissionGroupName = 'token-transfer';
  const permissionGroupDetails = useSelector((state: AppState) =>
    getPermissionGroupDetails(state, permissionGroupName),
  );
  const handlePermissionGroupItemClick = (chainId: Hex) => {
    history.push(
      `${REVIEW_GATOR_PERMISSIONS_ROUTE}/${chainId}/${permissionGroupName}`,
    );
  };

  const renderPageContent = () =>
    permissionGroupDetails.map(({ chainId, total }) => {
      const text =
        total === 1
          ? t('tokenPermissionCount', [total])
          : t('tokenPermissionsCount', [total]);
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
            onClick={() => history.push(GATOR_PERMISSIONS)}
            size={ButtonIconSize.Sm}
          />
        }
      >
        <Text
          variant={TextVariant.HeadingMd}
          textAlign={TextAlign.Center}
          data-testid="token-transfer-page-title"
        >
          {t('tokenTransfer')}
        </Text>
      </Header>
      <Content padding={0}>
        {permissionGroupDetails.length > 0 ? (
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
