import React, { useContext } from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { Content, Footer, Header, Page } from '../page';
import { I18nContext } from '../../../../contexts/i18n';
import {
  Box,
  ButtonIcon,
  ButtonIconSize,
  ButtonPrimary,
  ButtonPrimarySize,
  ButtonSecondary,
  ButtonSecondarySize,
  IconName,
  Label,
  PickerNetwork,
} from '../../../component-library';
import {
  BlockSize,
  BorderColor,
  Display,
  FlexDirection,
  JustifyContent,
  TextAlign,
} from '../../../../helpers/constants/design-system';
import {
  getCurrentNetwork,
  getMetaMaskAccountsOrdered,
  getSelectedIdentity,
} from '../../../../selectors';
import { AccountPicker, AccountListItem } from '../..';
import DomainInput from '../../../../pages/send/send-content/add-recipient/domain-input.component';

export const SendPage = () => {
  const t = useContext(I18nContext);

  // Network
  const currentNetwork = useSelector(getCurrentNetwork);

  // Account
  const identity = useSelector(getSelectedIdentity);

  // Your Accounts
  const accounts = useSelector(getMetaMaskAccountsOrdered);

  const SendPageRow = ({ children }) => (
    <Box
      display={Display.Flex}
      paddingBottom={6}
      flexDirection={FlexDirection.Column}
    >
      {children}
    </Box>
  );
  SendPageRow.propTypes = {
    children: PropTypes.element,
  };

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
        <SendPageRow>
          <PickerNetwork
            label={currentNetwork?.nickname}
            src={currentNetwork?.rpcPrefs?.imageUrl}
          />
        </SendPageRow>
        <SendPageRow>
          <Label paddingBottom={2}>{t('from')}</Label>
          <AccountPicker
            address={identity.address}
            name={identity.name}
            onClick={() => undefined}
            showAddress
            borderColor={BorderColor.borderDefault}
            borderWidth={1}
            paddingTop={4}
            paddingBottom={4}
            block
            justifyContent={JustifyContent.flexStart}
            addressProps={{
              display: Display.Flex,
              textAlign: TextAlign.Start,
            }}
            labelProps={{
              style: { flexGrow: 1, textAlign: 'start' },
              paddingInlineStart: 2,
            }}
            textProps={{
              display: Display.Flex,
              width: BlockSize.Full,
            }}
            width={BlockSize.Full}
          />
        </SendPageRow>
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
        <SendPageRow>
          <Label paddingBottom={2}>{t('yourAccounts')}</Label>
          {accounts.map((account) => (
            <AccountListItem
              identity={account}
              key={account.address}
              onClick={() => undefined}
            />
          ))}
        </SendPageRow>
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
