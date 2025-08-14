import React from 'react';

import { useHistory, useParams } from 'react-router-dom';
import {
  Box,
  ButtonIcon,
  ButtonIconSize,
  IconName,
  Text,
} from '../../../components/component-library';
import {
  Content,
  Header,
  Page,
} from '../../../components/multichain/pages/page';
import {
  Display,
  FlexDirection,
  JustifyContent,
  TextAlign,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';

export const MultichainAccountDetailsPage = () => {
  const t = useI18nContext();
  const history = useHistory();
  const { id } = useParams();
  const decodedAccountGroupId = decodeURIComponent(id as string);

  return (
    <Page className="multichain-account-details-page">
      <Header
        textProps={{
          variant: TextVariant.headingSm,
        }}
        startAccessory={
          <ButtonIcon
            size={ButtonIconSize.Md}
            ariaLabel={t('back')}
            iconName={IconName.ArrowLeft}
            onClick={() => history.goBack()}
          />
        }
      >
        {t('accountDetails')}
      </Header>
      <Content className="account-list-page__content">
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          justifyContent={JustifyContent.center}
        >
          <Text textAlign={TextAlign.Center}>
            Multichain Account Details Page Content ({decodedAccountGroupId})
          </Text>
        </Box>
      </Content>
    </Page>
  );
};
