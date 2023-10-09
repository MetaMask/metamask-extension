import React, { useContext } from 'react';
import { Content, Footer, Header, Page } from '../page';
import { I18nContext } from '../../../../contexts/i18n';
import {
  ButtonIcon,
  ButtonIconSize,
  ButtonPrimary,
  ButtonSecondary,
  IconName,
} from '../../../component-library';

export const SendPage = () => {
  const t = useContext(I18nContext);

  return (
    <Page className="multichain-send-page">
      <Header
        startAccessory={
          <ButtonIcon
            size={ButtonIconSize.Sm}
            ariaLabel={t('back')}
            iconName={IconName.ArrowLeft}
          />
        }
      >
        {t('sendAToken')}
      </Header>
      <Content></Content>
      <Footer>
        <ButtonSecondary block>{t('cancel')}</ButtonSecondary>
        <ButtonPrimary block disabled>
          {t('confirm')}
        </ButtonPrimary>
      </Footer>
    </Page>
  );
};
