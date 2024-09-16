import React, { useContext, useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { isEvmAccountType } from '@metamask/keyring-api';
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
  BorderStyle,
  JustifyContent,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import { SendPageAccountPicker } from '../send/components';
import { useMultichainSelector } from '../../../../hooks/useMultichainSelector';
import {
  getCurrentMultichainDraftTransaction,
  getCurrentMultichainDraftTransactionId,
  getMultichainNetwork,
} from '../../../../selectors/multichain';
import { getSelectedInternalAccount } from '../../../../selectors';
import {
  clearDraft,
  SendStage,
  startNewMultichainDraftTransaction,
  updateStage,
} from '../../../../ducks/multichain-send/multichain-send';
import Spinner from '../../../ui/spinner';
import { MultichainFee } from './components/fee';
import { SendPageRecipientInput } from './components/recipient-input';
import { MultichainAssetPickerAmount } from './components/asset-picker-amount';
import { MultichainNotices } from './components/multichain-notices';

export const MultichainSendPage = () => {
  const [loading, setLoading] = useState(true);
  const t = useContext(I18nContext);
  const history = useHistory();
  const selectedAccount = useSelector(getSelectedInternalAccount);
  const multichainNetwork = useMultichainSelector(
    getMultichainNetwork,
    selectedAccount,
  );
  const dispatch = useDispatch();
  const draftTransactionExists = useSelector(
    getCurrentMultichainDraftTransactionId,
  );

  useEffect(() => {
    if (isEvmAccountType(selectedAccount.type)) {
      history.push('/send');
    }
  }, [selectedAccount]);

  useEffect(() => {
    let isMounted = true;
    const createNewDraft = async () => {
      await dispatch(
        startNewMultichainDraftTransaction({
          account: selectedAccount,
          network: multichainNetwork.chainId,
        }),
      );
      if (isMounted) {
        setLoading(false);
      }
    };

    if (draftTransactionExists) {
      setLoading(false);
    } else {
      createNewDraft();
    }

    return () => {
      isMounted = false;
    };
  }, [draftTransactionExists]);

  const draftTransaction = useSelector(getCurrentMultichainDraftTransaction);

  const onCancel = () => {
    dispatch(clearDraft());
    history.push('/home');
  };

  const onSubmit = () => {
    dispatch(updateStage({ stage: SendStage.PENDING_CONFIRMATION }));
    history.push(`/multichain-confirm-transaction/${draftTransactionExists}`);
  };

  const submitDisabled =
    draftTransaction?.valid !== null && !draftTransaction?.valid;
  const isSendFormShown = draftTransactionExists;

  return (
    <Page
      className="multichain-send-page"
      backgroundColor={BackgroundColor.backgroundAlternative}
    >
      <Header
        textProps={{
          variant: TextVariant.headingSm,
        }}
        justifyContent={JustifyContent.center}
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
      {!loading && draftTransaction ? (
        <Content backgroundColor={BackgroundColor.backgroundAlternative}>
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
            {isSendFormShown && (
              <SendPageRecipientInput transactionId={draftTransaction.id} />
            )}
          </Box>
          {isSendFormShown && (
            <MultichainFee
              asset={draftTransaction.transactionParams.sendAsset}
              backgroundColor={BackgroundColor.backgroundDefault}
              estimatedFee={draftTransaction.transactionParams.fee}
              sendStage={SendStage.DRAFT}
            />
          )}
          <MultichainNotices network={multichainNetwork.chainId} />
        </Content>
      ) : (
        <Spinner />
      )}

      <Footer borderStyle={BorderStyle.none}>
        <ButtonSecondary onClick={onCancel} size={ButtonSecondarySize.Lg} block>
          {t('cancel')}
        </ButtonSecondary>

        <ButtonPrimary
          onClick={onSubmit}
          // loading={isSubmitting}
          size={ButtonPrimarySize.Lg}
          disabled={submitDisabled}
          block
        >
          {t('review')}
        </ButtonPrimary>
      </Footer>
    </Page>
  );
};
