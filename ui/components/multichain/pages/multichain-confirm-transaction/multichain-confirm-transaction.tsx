import React from 'react';
import { useHistory } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { PageContainerFooter } from '../../../ui/page-container';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { Content, Header, Page } from '../page';
import {
  BackgroundColor,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import {
  Box,
  ButtonIcon,
  ButtonIconSize,
  IconName,
} from '../../../component-library';
import {
  clearDraft,
  signAndSend,
} from '../../../../ducks/multichain-send/multichain-send';
import { MultichainFee } from '../multichain-send/components/fee';
import { MULTICHAIN_PROVIDER_CONFIGS } from '../../../../../shared/constants/multichain/networks';
import {
  getCurrentMultichainDraftTransaction,
  getCurrentMultichainDraftTransactionId,
  getMultichainSendStage,
} from '../../../../selectors/multichain';
import { getInternalAccount } from '../../../../selectors';
import { MultichainConfirmationAssetTotal } from './components/confirmation-asset';
import { SenderRecipientNetworkSummary } from './components/sender-recipient-network-summary';

export const MultichainConfirmTransactionPage = () => {
  const t = useI18nContext();
  const history = useHistory();
  const dispatch = useDispatch();

  const transactionId = useSelector(getCurrentMultichainDraftTransactionId);
  const transaction = useSelector(getCurrentMultichainDraftTransaction);
  const sendStage = useSelector(getMultichainSendStage);

  if (!transaction || !transactionId) {
    history.push('/multichain-send');
    return null;
  }

  const selectedAccount = useSelector((state) =>
    getInternalAccount(state, transaction.transactionParams.sender.id),
  );
  const { fee: estimateFee } = transaction.transactionParams;

  if (!transaction) {
    history.push('/multichain-send');
  }

  const onCancel = () => {
    // remove draft
    dispatch(clearDraft());
    history.push('/home');
  };

  const onBack = () => {
    history.push('/multichain-send');
  };

  const confirmTranasction = async () => {
    await dispatch(
      signAndSend({
        account: selectedAccount,
        transactionId,
      }),
    );
    history.push('/');
  };

  return (
    <Page
      className="multichain-send-page"
      backgroundColor={BackgroundColor.backgroundAlternative}
    >
      <Header
        backgroundColor={BackgroundColor.backgroundAlternative}
        textProps={{
          variant: TextVariant.headingSm,
        }}
        startAccessory={
          <ButtonIcon
            size={ButtonIconSize.Sm}
            ariaLabel={t('back')}
            iconName={IconName.ArrowLeft}
            data-testid="multichain-confirm-transaction-back-button"
            onClick={onBack}
          />
        }
      >
        {t('review')}
      </Header>
      <Content>
        <MultichainConfirmationAssetTotal
          fee={estimateFee}
          sendAsset={transaction.transactionParams.sendAsset}
        />
        <SenderRecipientNetworkSummary
          transactionParams={transaction.transactionParams}
          network={
            MULTICHAIN_PROVIDER_CONFIGS[
              transaction.transactionParams.network.network
            ]
          }
        />
        {estimateFee && (
          <Box marginBottom={4}>
            <MultichainFee
              asset={transaction.transactionParams.sendAsset}
              backgroundColor={BackgroundColor.backgroundDefault}
              estimatedFee={estimateFee}
              sendStage={sendStage}
            />
          </Box>
        )}
      </Content>
      <PageContainerFooter
        onCancel={onCancel}
        cancelText={t('cancel')}
        onSubmit={async () => await confirmTranasction()}
        submitText={t('confirm')}
        submitButtonType={'primary'}
      ></PageContainerFooter>
    </Page>
  );
};
