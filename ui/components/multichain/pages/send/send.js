import React, { useCallback, useContext, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { useLocation } from 'react-router-dom';
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
import DomainInput from '../../../../pages/send/send-content/add-recipient/domain-input';
import {
  addHistoryEntry,
  getDraftTransactionExists,
  getIsUsingMyAccountForRecipientSearch,
  getRecipient,
  getRecipientUserInput,
  resetRecipientInput,
  resetSendState,
  startNewDraftTransaction,
  updateRecipient,
  updateRecipientUserInput,
} from '../../../../ducks/send';
import { AssetType } from '../../../../../shared/constants/transaction';
import { showQrScanner } from '../../../../store/actions';
import { MetaMetricsEventCategory } from '../../../../../shared/constants/metametrics';
import { MetaMetricsContext } from '../../../../contexts/metametrics';

export const SendPage = () => {
  const t = useContext(I18nContext);
  const trackEvent = useContext(MetaMetricsContext);

  // Network
  const currentNetwork = useSelector(getCurrentNetwork);

  // Account
  const identity = useSelector(getSelectedIdentity);

  // Your Accounts
  const dispatch = useDispatch();
  const recipient = useSelector(getRecipient);
  const accounts = useSelector(getMetaMaskAccountsOrdered);
  const userInput = useSelector(getRecipientUserInput);
  const isUsingMyAccountsForRecipientSearch = useSelector(
    getIsUsingMyAccountForRecipientSearch,
  );
  const draftTransactionExists = useSelector(getDraftTransactionExists);
  const location = useLocation();
  const startedNewDraftTransaction = useRef(false);

  const cleanup = useCallback(() => {
    console.log('cleanup, resetting send state via resetSendState()');
    dispatch(resetSendState());
  }, [dispatch]);

  /**
   * It is possible to route to this page directly, either by typing in the url
   * or by clicking the browser back button after progressing to the confirm
   * screen. In the case where a draft transaction does not yet exist, this
   * hook is responsible for creating it. We will assume that this is a native
   * asset send.
   */
  useEffect(() => {
    if (
      draftTransactionExists === false &&
      startedNewDraftTransaction.current === false
    ) {
      console.log('use effect run!');
      startedNewDraftTransaction.current = true;
      dispatch(startNewDraftTransaction({ type: AssetType.native }));
    }
  }, [draftTransactionExists, dispatch]);

  useEffect(() => {
    window.addEventListener('beforeunload', cleanup);
  }, [cleanup]);

  useEffect(() => {
    return () => {
      dispatch(resetSendState());
      window.removeEventListener('beforeunload', cleanup);
    };
  }, [dispatch, cleanup]);

  useEffect(() => {
    if (location.search === '?scan=true') {
      dispatch(showQrScanner());

      // Clear the queryString param after showing the modal
      const cleanUrl = window.location.href.split('?')[0];
      window.history.pushState({}, null, `${cleanUrl}`);
      window.location.hash = '#send';
    }
  }, [location, dispatch]);

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
            userInput={userInput}
            className="send__to-row"
            onChange={(address) => dispatch(updateRecipientUserInput(address))}
            onValidAddressTyped={async (address) => {
              dispatch(
                addHistoryEntry(`sendFlow - Valid address typed ${address}`),
              );
              await dispatch(updateRecipientUserInput(address));
              dispatch(updateRecipient({ address, nickname: '' }));
            }}
            internalSearch={isUsingMyAccountsForRecipientSearch}
            selectedAddress={recipient.address}
            selectedName={recipient.nickname}
            onPaste={(text) => {
              dispatch(
                addHistoryEntry(
                  `sendFlow - User pasted ${text} into address field`,
                ),
              );
            }}
            onReset={() => dispatch(resetRecipientInput())}
            scanQrCode={() => {
              trackEvent({
                event: 'Used QR scanner',
                category: MetaMetricsEventCategory.Transactions,
                properties: {
                  action: 'Edit Screen',
                  legacy_event: true,
                },
              });
              dispatch(showQrScanner());
            }}
          />
        </SendPageRow>
        <SendPageRow>
          <Label paddingBottom={2}>{t('yourAccounts')}</Label>
          {accounts.map((account) => (
            <AccountListItem
              identity={account}
              key={account.address}
              onClick={() => {
                console.log('account is: ', account);
                dispatch(
                  addHistoryEntry(
                    `sendFlow - User clicked recipient from my accounts. address: ${account.address}, nickname ${account.name}`,
                  ),
                );
                dispatch(
                  updateRecipient({
                    address: account.address,
                    nickname: account.name,
                  }),
                );
                dispatch(updateRecipientUserInput(account.address));
              }}
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
