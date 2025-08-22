import React from 'react';
import { useHistory } from 'react-router-dom';
import { Content, Header, Page } from '../page';
import {
  Box,
  ButtonIcon,
  ButtonIconSize,
  IconName,
  Text,
} from '../../../component-library';
import {
  IconColor,
  BackgroundColor,
  BlockSize,
  Display,
  FlexDirection,
  JustifyContent,
  TextAlign,
  TextColor,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { DEFAULT_ROUTE } from '../../../../helpers/constants/routes';

export const GatorPermissionsPage = () => {
  const t = useI18nContext();
  const history = useHistory();

  return (
    <Page className="main-container" data-testid="permissions-page">
      <Header
        backgroundColor={BackgroundColor.backgroundDefault}
        startAccessory={
          <ButtonIcon
            ariaLabel={t('back')}
            iconName={IconName.ArrowLeft}
            className="connections-header__start-accessory"
            color={IconColor.iconDefault}
            onClick={() => history.push(DEFAULT_ROUTE)}
            size={ButtonIconSize.Sm}
          />
        }
      >
        <Text
          as="span"
          variant={TextVariant.headingMd}
          textAlign={TextAlign.Center}
        >
          {t('permissions')}
        </Text>
      </Header>
      <Content padding={0}>
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
      </Content>
    </Page>
  );
};
