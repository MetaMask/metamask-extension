import React, { useState, useContext, useEffect } from 'react';
import { InternalAccount } from '@metamask/keyring-api';
import { useHistory, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { I18nContext } from '../../../../contexts/i18n';
import {
  ButtonIcon,
  ButtonIconSize,
  ButtonPrimary,
  ButtonPrimarySize,
  ButtonSecondary,
  ButtonSecondarySize,
  IconName,
  Box,
} from '../../../component-library';

import { Content, Footer, Header, Page } from '../page';

import {
  BackgroundColor,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import { SendPageAccountPicker } from '../send/components';
import { getSendStage, SEND_STAGES } from '../../../../ducks/send';
import { useMultichainSelector } from '../../../../hooks/useMultichainSelector';
import {
  getCurrentMultichainDraftTransaction,
  getCurrentMultichainDraftTransactionId,
  getMultichainNetwork,
} from '../../../../selectors/multichain';
import { getSelectedInternalAccount } from '../../../../selectors';
import {
  clearDraft,
  DraftTransaction,
} from '../../../../ducks/multichain-send/multichain-send';
import { TransactionNotice } from './components/transaction-notice';
import { MultichainFee } from './components/fee';
import { SendPageRecipientInput } from './components/recipient-input';
import { MultichainAssetPickerAmount } from './components/asset-picker-amount';

export const MultichainSendPage = () => {
  const t = useContext(I18nContext);
  const history = useHistory();
  const selectedAccount = useSelector(getSelectedInternalAccount);
  const multichainNetwork = useMultichainSelector(
    getMultichainNetwork,
    selectedAccount,
  );
  const dispatch = useDispatch();
  // const history = useHistory();
  // const location = useLocation();
  // location.pathname;
  const draftTransactionExists = useSelector(
    getCurrentMultichainDraftTransactionId,
  );

  useEffect(() => {
    if (!draftTransactionExists) {
      dispatch({
        type: 'multichainSend/addNewDraft',
        payload: {
          account: selectedAccount,
          multichainNetwork,
        },
      });
    }
  }, [draftTransactionExists]);

  const draftTransaction: DraftTransaction = useSelector(
    getCurrentMultichainDraftTransaction,
  );

  console.log('draftTransaction', draftTransaction);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const onCancel = () => {
    dispatch(clearDraft());
    history.push('/home');
  };

  const onSubmit = () => {
    history.push(`/multichain-confirm-transaction/${draftTransactionExists}`);
  };

  const sendStage = useSelector(getSendStage);

  const submitDisabled = draftTransaction?.valid;
  const isSendFormShown = draftTransactionExists;

  const onAmountChange = (amount: string) => {};
  const handleSelectSendToken = (asset: any) => {};

  return (
    <Page className="multichain-send-page">
      <Header
        textProps={{
          variant: TextVariant.headingSm,
        }}
        startAccessory={
          <ButtonIcon
            size={ButtonIconSize.Sm}
            ariaLabel={t('back')}
            iconName={IconName.ArrowLeft}
            onClick={onCancel}
          />
        }
      >
        {t('send')}
      </Header>
      <Content>
        <Content>
          <SendPageAccountPicker />
          {isSendFormShown && (
            <MultichainAssetPickerAmount
              error={draftTransaction.transactionParams.sendAsset.error}
              asset={draftTransaction.transactionParams.sendAsset.assetDetails}
              amount={{
                error: draftTransaction.transactionParams.sendAsset.error,
                value: draftTransaction.transactionParams.sendAsset.amount,
              }}
            />
          )}
          <Box marginTop={6}>
            {isSendFormShown && <SendPageRecipientInput />}
          </Box>
          {isSendFormShown && (
            <MultichainFee
              backgroundColor={BackgroundColor.backgroundAlternative}
              estimatedFee={draftTransaction.transactionParams.fee}
            />
          )}

          {/* TODO: set notices to network specific components */}
          <TransactionNotice notice={t('satProtection')} />
        </Content>
      </Content>
      <Footer>
        <ButtonSecondary onClick={onCancel} size={ButtonSecondarySize.Lg} block>
          {sendStage === SEND_STAGES.EDIT ? t('reject') : t('cancel')}
        </ButtonSecondary>

        <ButtonPrimary
          onClick={onSubmit}
          loading={isSubmitting}
          size={ButtonPrimarySize.Lg}
          disabled={submitDisabled || isSubmitting}
          block
        >
          {t('review')}
        </ButtonPrimary>
      </Footer>
    </Page>
  );
};
