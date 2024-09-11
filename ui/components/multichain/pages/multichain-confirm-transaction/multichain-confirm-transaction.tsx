import React from 'react';
import { useHistory } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { PageContainerFooter } from '../../../ui/page-container';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { Content, Header, Page } from '../page';
import {
  BackgroundColor,
  BorderRadius,
  BorderStyle,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import {
  Box,
  ButtonIcon,
  ButtonIconSize,
  IconName,
} from '../../../component-library';
import SenderToRecipient from '../../../ui/sender-to-recipient';
import {
  clearDraft,
  signAndSend,
} from '../../../../ducks/multichain-send/multichain-send';
import { MultichainFee } from '../multichain-send/components/fee';
import {
  MULTICHAIN_PROVIDER_CONFIGS,
  MultichainNetworks,
} from '../../../../../shared/constants/multichain/networks';
import {
  getCurrentMultichainDraftTransaction,
  getCurrentMultichainDraftTransactionId,
} from '../../../../selectors/multichain';
import { getInternalAccount } from '../../../../selectors';
import { MultichainTransactionNetwork } from './components/network';
import { MultichainConfirmationAssetTotal } from './components/confirmation-asset';

export const MultichainConfirmTransactionPage = () => {
  const t = useI18nContext();
  const history = useHistory();
  const dispatch = useDispatch();

  const transactionId = useSelector(getCurrentMultichainDraftTransactionId);
  const transaction = useSelector(getCurrentMultichainDraftTransaction);

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

  const confirmTranasction = async () => {
    await dispatch(
      signAndSend({
        account: selectedAccount,
        transactionId,
      }),
    );
  };

  return (
    <Page
      className="multichain-send-page"
      backgroundColor={BackgroundColor.backgroundAlternative}
    >
      <Header
        backgroundColor={BackgroundColor.backgroundDefault}
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
        {t('review')}
      </Header>
      <Content>
        <MultichainConfirmationAssetTotal
          fee={estimateFee}
          sendAsset={transaction.transactionParams.sendAsset}
        />
        <Box
          backgroundColor={BackgroundColor.backgroundDefault}
          borderRadius={BorderRadius.LG}
          marginBottom={4}
        >
          <SenderToRecipient
            // eslint-disable-next-line no-empty-function
            onRecipientClick={function noRefCheck() {}}
            // eslint-disable-next-line no-empty-function
            onSenderClick={function noRefCheck() {}}
            recipientAddress={transaction.transactionParams.recipient.address}
            senderAddress={selectedAccount.address}
            senderName={selectedAccount.metadata.name}
          />
        </Box>
        <Box
          backgroundColor={BackgroundColor.backgroundDefault}
          borderStyle={BorderStyle.solid}
          borderRadius={BorderRadius.LG}
          marginBottom={4}
        >
          <MultichainTransactionNetwork
            network={MULTICHAIN_PROVIDER_CONFIGS[MultichainNetworks.BITCOIN]}
          />
        </Box>
        {estimateFee && (
          <Box marginBottom={4}>
            <MultichainFee
              asset={transaction.transactionParams.sendAsset}
              backgroundColor={BackgroundColor.backgroundDefault}
              estimatedFee={estimateFee}
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
