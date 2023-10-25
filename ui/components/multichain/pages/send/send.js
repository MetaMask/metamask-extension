import React, { useCallback, useContext, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
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
import { Content, Footer, Header, Page } from '../page';
import DomainInput from '../../../../pages/send/send-content/add-recipient/domain-input.component';
import {
  getDraftTransactionExists,
  resetSendState,
  startNewDraftTransaction,
} from '../../../../ducks/send';
import { AssetType } from '../../../../../shared/constants/transaction';
import { showQrScanner } from '../../../../store/actions';
import {
  SendPageAccountPicker,
  SendPageRow,
  SendPageYourAccount,
  SendPageNetworkPicker,
} from './components';

export const SendPage = () => {
  const t = useContext(I18nContext);
  const dispatch = useDispatch();

  const startedNewDraftTransaction = useRef(false);
  const draftTransactionExists = useSelector(getDraftTransactionExists);
  const location = useLocation();

  const cleanup = useCallback(() => {
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
      startedNewDraftTransaction.current = true;
      dispatch(startNewDraftTransaction({ type: AssetType.native }));
    }
  }, [draftTransactionExists, dispatch]);

  useEffect(() => {
    window.addEventListener('beforeunload', cleanup);
  }, [cleanup]);

  useEffect(() => {
    if (location.search === '?scan=true') {
      dispatch(showQrScanner());

      // Clear the queryString param after showing the modal
      const [cleanUrl] = window.location.href.split('?');
      window.history.pushState({}, null, `${cleanUrl}`);
      window.location.hash = '#send';
    }
  }, [location, dispatch]);

  useEffect(() => {
    return () => {
      dispatch(resetSendState());
      window.removeEventListener('beforeunload', cleanup);
    };
  }, [dispatch, cleanup]);

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
