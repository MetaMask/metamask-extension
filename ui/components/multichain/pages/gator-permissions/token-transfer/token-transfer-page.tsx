import React, { useRef } from 'react';
import { useHistory } from 'react-router-dom';
import { Content, Header, Page } from '../../page';
import {
  Box,
  ButtonIcon,
  ButtonIconSize,
  IconName,
  Text,
} from '../../../../component-library';
import {
  IconColor,
  BackgroundColor,
  TextAlign,
  TextVariant,
  BlockSize,
  Display,
  FlexDirection,
  JustifyContent,
  TextColor,
} from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import {
  GATOR_PERMISSIONS,
  REVIEW_GATOR_PERMISSIONS_ROUTE,
} from '../../../../../helpers/constants/routes';
import { PermissionGroupListItem } from '../components';
import { useSelector } from 'react-redux';
import {
  AppState,
  getPermissionGroupDetails,
} from '../../../../../selectors/gator-permissions/gator-permissions';

export const TokenTransferPage = () => {
  const t = useI18nContext();
  const history = useHistory();
  const headerRef = useRef<HTMLSpanElement>(null);
  const permissionGroupDetails = useSelector((state: AppState) =>
    getPermissionGroupDetails(state, 'token-transfer'),
  );

  const handlePermissionGroupItemClick = (chainId: string) => {
    history.push(`${REVIEW_GATOR_PERMISSIONS_ROUTE}/${chainId}/token-transfer`);
  };

  const renderPageContent = () =>
    permissionGroupDetails.map(({ chainId, total }) => {
      const description =
          total === 1
            ? t('tokenPermissionCount', [total])
            : t('tokenPermissionsCount', [total]);
      return (
        <PermissionGroupListItem
          data-testid="permission-group-list-item"
          key={chainId}
          chainId={chainId}
          total={total}
          description={description}
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
            color={IconColor.iconDefault}
            onClick={() => history.push(GATOR_PERMISSIONS)}
            size={ButtonIconSize.Sm}
          />
        }
      >
        <Text
          as="span"
          variant={TextVariant.headingMd}
          textAlign={TextAlign.Center}
          data-testid="token-transfer-page-title"
        >
          {t('tokenTransfer')}
        </Text>
      </Header>
      <Content padding={0}>
        <Box ref={headerRef}></Box>
        {permissionGroupDetails.length > 0 ? (
          renderPageContent()
        ) : (
          <Box
            data-testid="no-connections"
            display={Display.Flex}
            flexDirection={FlexDirection.Column}
            justifyContent={JustifyContent.center}
            height={BlockSize.Full}
            gap={2}
            padding={4}
          >
            <Text
              variant={TextVariant.bodyMdMedium}
              backgroundColor={BackgroundColor.backgroundDefault}
              textAlign={TextAlign.Center}
            >
              {t('permissionsPageEmptyContent')}
            </Text>
            <Text
              variant={TextVariant.bodyMd}
              color={TextColor.textAlternative}
              backgroundColor={BackgroundColor.backgroundDefault}
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
