import React, { useContext } from 'react';
import { Content, Footer, Header, Page } from '../page';
import { I18nContext } from '../../../../contexts/i18n';
import {
  ButtonIcon,
  ButtonIconSize,
  ButtonPrimary,
  ButtonPrimarySize,
  ButtonSecondary,
  ButtonSecondarySize,
  IconName,
  Label,
} from '../../../component-library';
import DomainInput from '../../../../pages/send/send-content/add-recipient/domain-input.component';
import { SendPageNetworkPicker } from './components/network-picker';
import {
  SendPageAccountPicker,
  SendPageRow,
  SendPageYourAccount,
} from './components';

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
      <Content>
        <SendPageNetworkPicker />
        <SendPageAccountPicker />
        <SendPageRow>
          <Label paddingBottom={2}>{t('to')}</Label>
          <DomainInput
            userInput=""
            onChange={() => undefined}
            onReset={() => undefined}
            lookupEnsName={() => undefined}
            initializeDomainSlice={() => undefined}
            resetDomainResolution={() => undefined}
          />
        </SendPageRow>
        <SendPageYourAccount />
      </Content>
      <Footer>
        <ButtonSecondary size={ButtonSecondarySize.Lg} block>
          {t('cancel')}
        </ButtonSecondary>
        <ButtonPrimary size={ButtonPrimarySize.Lg} block disabled>
          {t('confirm')}
        </ButtonPrimary>
      </Footer>
    </Page>
  );
};
