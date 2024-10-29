import {
  EthAccountType,
  InternalAccount,
  isEvmAccountType,
  KeyringAccountType,
} from '@metamask/keyring-api';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { useEffect, useMemo } from 'react';
import * as ethSendFlow from '../../ducks/send';
import {
  DraftTransaction,
  getCurrentDraftTransaction,
  Recipient,
  startNewDraftTransaction,
} from '../../ducks/send';
import { getSelectedInternalAccount } from '../../selectors';
import { getIsDraftSwapAndSend } from '../../ducks/send/helpers';

type IUpdateSendAssetFunc = // (token: any, initialAsset: any): Promise<void>;
  (token: string) => Promise<void>;

type ISendFlow = () => {
  actions: {
    resetSendState: () => void;
    signTransaction: () => Promise<void>;
    startNewDraftTransaction: () => Promise<void>;
    updateSendAmount: () => Promise<void>;
    updateSendAsset: (token: string) => Promise<void>;
    toggleSendMaxMode: () => void;
  };
  selectors: {
    getCurrentDraftTransaction: () => DraftTransaction;
    getDraftTransactionExists: () => boolean;
    getDraftTransactionID: () => string;
    getRecipient: () => Recipient;
    getRecipientWarningAcknowledgement: () => boolean;
    getSendAnalyticProperties: () => any;
    getSendErrors: () => string | undefined;
    getIsNativeSendPossible: () => boolean;
    getSendMaxModeState: () => string;
    getSendStage: () => string;
    isSendFormInvalid: () => boolean;
    getIsDraftSwapAndSend: () => boolean;
  };
};

// @ts-expect-error TODO: implement
const useMultichainSendFlow: ISendFlow = () => {
  return {
    actions: {
      resetSendState: ethSendFlow.resetSendState,
      signTransaction: ethSendFlow.signTransaction,
      startNewDraftTransaction: ethSendFlow.startNewDraftTransaction,
      updateSendAmount: ethSendFlow.updateSendAmount,
      updateSendAsset: ethSendFlow.updateSendAsset,
      toggleSendMaxMode: ethSendFlow.toggleSendMaxMode,
    },
    selectors: {
      getCurrentDraftTransaction: ethSendFlow.getCurrentDraftTransaction,
      getDraftTransactionExists: ethSendFlow.getDraftTransactionExists,
      getDraftTransactionID: ethSendFlow.getDraftTransactionID,
      getRecipient: ethSendFlow.getRecipient,
      getRecipientWarningAcknowledgement:
        ethSendFlow.getRecipientWarningAcknowledgement,
      getSendAnalyticProperties: ethSendFlow.getSendAnalyticProperties,
      getSendErrors: ethSendFlow.getSendErrors,
      getIsNativeSendPossible: ethSendFlow.getIsNativeSendPossible,
      getSendMaxModeState: ethSendFlow.getSendMaxModeState,
      getSendStage: ethSendFlow.getSendStage,
      isSendFormInvalid: ethSendFlow.isSendFormInvalid,
      getIsDraftSwapAndSend: getIsDraftSwapAndSend(getCurrentDraftTransaction),
    },
  };
};

const useEvmSendFlow: ISendFlow = () => {
  return {
    actions: {
      resetSendState: ethSendFlow.resetSendState,
      signTransaction: ethSendFlow.signTransaction,
      startNewDraftTransaction: ethSendFlow.startNewDraftTransaction,
      updateSendAmount: ethSendFlow.updateSendAmount,
      updateSendAsset: ethSendFlow.updateSendAsset,
      toggleSendMaxMode: ethSendFlow.toggleSendMaxMode,
    },
    selectors: {
      getCurrentDraftTransaction: ethSendFlow.getCurrentDraftTransaction,
      getDraftTransactionExists: ethSendFlow.getDraftTransactionExists,
      getDraftTransactionID: ethSendFlow.getDraftTransactionID,
      getRecipient: ethSendFlow.getRecipient,
      getRecipientWarningAcknowledgement:
        ethSendFlow.getRecipientWarningAcknowledgement,
      getSendAnalyticProperties: ethSendFlow.getSendAnalyticProperties,
      getSendErrors: ethSendFlow.getSendErrors,
      getIsNativeSendPossible: ethSendFlow.getIsNativeSendPossible,
      getSendMaxModeState: ethSendFlow.getSendMaxModeState,
      getSendStage: ethSendFlow.getSendStage,
      isSendFormInvalid: ethSendFlow.isSendFormInvalid,
      getIsDraftSwapAndSend: getIsDraftSwapAndSend(getCurrentDraftTransaction),
    },
  };
};

export const useSendFlow = (): ISendFlow => {
  const dispatch = useDispatch();
  const selectedAccount: InternalAccount = useSelector(
    getSelectedInternalAccount,
    shallowEqual,
  );

  const accountTypeChanged = useMemo(() => {
    return (
      [EthAccountType.Eoa, EthAccountType.Erc4337] as KeyringAccountType[]
    ).includes(selectedAccount.type);
  }, [selectedAccount.type]);

  useEffect(() => {
    // clear draft state when account type changes
    dispatch(startNewDraftTransaction);
  }, [accountTypeChanged]);

  if (isEvmAccountType(selectedAccount.type)) {
    return useEvmSendFlow();
  }

  return useMultichainSendFlow();
};
