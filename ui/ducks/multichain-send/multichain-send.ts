import { v4 as uuidv4 } from 'uuid';
import { BigNumber } from 'bignumber.js';
import {
  AnyAction,
  createAsyncThunk,
  createSlice,
  Dispatch,
} from '@reduxjs/toolkit';
import { CaipAccountAddress, CaipChainId } from '@metamask/utils';
import { CaipAssetId, InternalAccount } from '@metamask/keyring-api';
import { Json } from 'json-rpc-engine';
import { MultichainNetworks } from '../../../shared/constants/multichain/networks';
import messages from '../../../app/_locales/en/messages.json';
import {
  getMultichainNetwork,
  MultichainReduxSendState,
  MultichainState,
} from '../../selectors/multichain';
import { AssetType } from '../../../shared/constants/transaction';
import { NativeAsset } from '../../components/multichain/asset-picker-amount/asset-picker-modal/types';
import {
  INSUFFICIENT_FUNDS_ERROR,
  INSUFFICIENT_FUNDS_FOR_GAS_ERROR,
  NEGATIVE_OR_ZERO_AMOUNT_TOKENS_ERROR,
} from '../../pages/confirmations/send/send.constants';
import {
  getInternalAccount,
  getSelectedInternalAccount,
} from '../../selectors';
import { TransactionBuilderFactory } from './transaction-builders/transaction-builder';
import { SendManyTransaction } from './transaction-builders/bitcoin-transaction-builder';

// Senders
/*
  Cosmos, Ethereum, Solana: An address
  Bitcoin: One or more inputs (previous transaction outputs)
*/

// Receipient
/*
  Cosmos, Ethereum, Solana: An address
  Bitcoin: One or more outputs (addresses and amounts)
*/

/*
  Value/Amount:
  Cosmos: Amount and denomination (e.g., ATOM)
  Ethereum: Amount in Wei
  Solana: Amount in lamports
  Bitcoin: Amount in satoshis
*/

/*
Fee:

Cosmos: Gas price and gas limit
Ethereum: Gas price and gas limit
Solana: Transaction fee
Bitcoin: Fee (often calculated based on transaction size)

*/

/*

1. Create a draft transaction with the base fields
- sender
- recipient
- value
- fee
- optional data (e.g. memo and method for cosmos, data for ethereum, instructions for solana)
*/

export enum FeeLevel {
  Slow = 'slow',
  Average = 'average',
  Fast = 'fast',
}

export type MulitichainFeeEstimate = {
  fee: string;
  unit: string;
  feeInFiat: string;
  feeLevel: FeeLevel;
  confirmationTime: string;
  isLoading: boolean;
  error: string;
  valid: boolean;
};

export type TransactionParams = {
  sender: {
    id: string;
    address: CaipAccountAddress;
  };
  // Fields to build a native transaction
  sendAsset: {
    amount: string;
    asset: CaipAssetId;
    assetDetails: NativeAsset & {
      balance: string;
      details: { decimals: number };
    };
    // Required for assets that require denominatinos (e.g. cosmos)
    denominatinon?: string;
    error: string;
    valid: boolean;
  };
  receiveAsset: {
    amount: string;
    // CAIP-19 asset identifier
    asset: CaipAssetId;
    // Required for assets that require denominatinos (e.g. cosmos)
    denominatinon?: string;
    error: string;
    valid: boolean;
  };
  // options bag for additional data based on network
  data: Json;
  recipient: {
    // CAIP-10 address
    address: CaipAccountAddress;
    valid: boolean;
    error: string;
  };
  fee: MulitichainFeeEstimate;
  network: {
    network: CaipChainId;
    error: string;
  };
  error: string;
};

export enum SendStage {
  DRAFT = 'DRAFT',
  PUBLISHING = 'PUBLISHING',
  PUBLISHED = 'PUBLISHED',
  FAILURE = 'FAILURE',
}

export enum SendStatus {
  VALID = 'valid',
  INVALID = 'invalid',
}

export type DraftTransaction = {
  id: string;
  transactionParams: TransactionParams;
  transaction: SendManyTransaction | null;
  valid: boolean;
};

export type MultichainSendState = {
  currentTransactionUUID: string;
  draftTransactions: {
    [key: string]: DraftTransaction;
  };
  stage: SendStage;
  error: string;
};

export const initialMultichainSendState: MultichainSendState = {
  currentTransactionUUID: '',
  draftTransactions: {},
  stage: SendStage.DRAFT,
  error: '',
};

export const initialMultichainDraftTransaction: DraftTransaction = {
  id: '',
  transactionParams: {
    sender: {
      id: '',
      address: '',
    },
    sendAsset: {
      amount: '0',
      assetDetails: {
        type: AssetType.native,
        // @ts-expect-error TODO: create placeholder
        image: './images/placeholder.svg',
        symbol: '',
        balance: '0',
        details: {
          decimals: 8,
        },
      },
      asset: '',
      denominatinon: undefined,
      valid: false,
      error: '',
    },
    receiveAsset: {
      amount: '0',
      asset: '',
      denominatinon: undefined,
      valid: false,
      error: '',
    },
    recipient: {
      address: '',
      valid: false,
      error: '',
    },
    fee: {
      valid: false,
      error: '',
      isLoading: true,
      fee: '0',
      unit: '',
      confirmationTime: '',
      feeInFiat: '',
      feeLevel: FeeLevel.Average,
    },
    data: {},
    network: {
      network: MultichainNetworks.BITCOIN,
      error: '',
    },
  },
  transaction: null,
  valid: false,
  error: '',
};

export type MultichainSendAsyncThunkConfig = {
  state: {
    multichainSend: MultichainSendState;
  };
  dispatch: Dispatch<AnyAction>;
};

export const initializeSendState = createAsyncThunk<
  { id: string; transactionParams: TransactionParams },
  { account: InternalAccount; network: CaipChainId },
  {
    state: MultichainReduxSendState;
    dispatch: Dispatch<AnyAction>;
    rejectValue: {
      error: string;
    };
  }
>(
  'multichainSend/initializeSendState',
  async ({ account, network }, thunkApi) => {
    let state = thunkApi.getState();

    if (!state.multichainSend.currentTransactionUUID) {
      thunkApi.dispatch({
        type: 'multichainSend/addNewDraft',
        payload: { account, network },
      });
      state = thunkApi.getState();
    }

    const draftTransaction =
      state.multichainSend.draftTransactions[
        state.multichainSend.currentTransactionUUID
      ];
    const transactionBuilder = TransactionBuilderFactory.getBuilder(
      thunkApi,
      account,
      network,
      draftTransaction.transactionParams,
    );
    const sendAsset = transactionBuilder.setSendAsset();

    const balance = await transactionBuilder.queryAssetBalance(sendAsset.asset);

    const updatedTransactionParams: DraftTransaction['transactionParams'] = {
      ...draftTransaction.transactionParams,
      sendAsset: {
        ...draftTransaction.transactionParams.sendAsset,
        ...sendAsset,
        assetDetails: {
          ...draftTransaction.transactionParams.sendAsset.assetDetails,
          ...sendAsset.assetDetails,
          balance: balance.amount,
        },
        amount: '0',
      },
    };

    return {
      id: state.multichainSend.currentTransactionUUID as string, // TODO: remove cast. This was checked in the beginning.
      transactionParams: updatedTransactionParams,
    };
  },
);

export const estimateFee = createAsyncThunk<
  {
    unit: string;
    fee: string;
    confirmationTime: string;
  },
  { account: InternalAccount; transactionId: string },
  {
    state: { multichainSend: MultichainSendState };
    dispatch: Dispatch<AnyAction>;
    rejectValue: { error: string };
  }
>(
  'multichainSend/estimateFee',
  async ({ account, transactionId }, thunkApi) => {
    const state = thunkApi.getState();
    // @ts-expect-error TODO: fix type error
    const multichainNetwork = getMultichainNetwork(state, account);

    const transaction = state.multichainSend.draftTransactions[transactionId];

    const transactionBuilder = TransactionBuilderFactory.getBuilder(
      thunkApi,
      account,
      multichainNetwork.chainId,
      transaction.transactionParams,
    );

    const fee = await transactionBuilder.estimateGas();
    return fee;
  },
);

// Using async because of possible network requests asscoiated with updating the recipient
export const updateAndValidateRecipient = createAsyncThunk<
  DraftTransaction['transactionParams']['recipient'],
  {
    transactionId: string;
    recipient: string;
  },
  {
    state: { multichainSend: MultichainSendState };
    dispatch: Dispatch<AnyAction>;
    rejectValue: { error: string };
  }
>(
  'multichainSend/updateAndValidateRecipient',
  async ({ transactionId, recipient }, thunkApi) => {
    const state = thunkApi.getState();
    const transaction = state.multichainSend.draftTransactions[transactionId];
    const account = getInternalAccount(
      state,
      transaction.transactionParams.sender.id,
    );

    // @ts-expect-error TODO: fix type error
    const multichainNetwork = getMultichainNetwork(state, account);

    const transactionBuilder = TransactionBuilderFactory.getBuilder(
      thunkApi,
      account,
      multichainNetwork.chainId,
      transaction.transactionParams,
    );

    const updatedRecipient = transactionBuilder.setRecipient(recipient);
    return updatedRecipient;
  },
);

export const setMaxSendAssetAmount = createAsyncThunk<
  string,
  {
    transactionId: string;
  },
  {
    state: { multichainSend: MultichainSendState };
    dispatch: Dispatch<AnyAction>;
    rejectValue: { error: string };
  }
>(
  'multichainSend/setMaxSendAssetAmount',
  async ({ transactionId }, thunkApi) => {
    const state = thunkApi.getState();
    const account = getSelectedInternalAccount(state);
    const multichainNetwork = getMultichainNetwork(
      state as unknown as MultichainState, // TODO: fix combined reducer type
      account,
    );

    const draftTransaction =
      state.multichainSend.draftTransactions[transactionId];

    const transactionBuilder = TransactionBuilderFactory.getBuilder(
      thunkApi,
      account,
      multichainNetwork.chainId,
      draftTransaction.transactionParams,
    );

    const maxAmount = transactionBuilder.setMaxSendAmount();

    return maxAmount;
  },
);

export const signAndSend = createAsyncThunk<
  string,
  { account: InternalAccount; transactionId: string },
  MultichainSendAsyncThunkConfig
>(
  'multichainSend/signAndSend',
  async ({ account, transactionId }, thunkApi) => {
    const state = thunkApi.getState();
    const draftTransaction: DraftTransaction =
      state.multichainSend.draftTransactions[transactionId];

    const transactionBuilder = TransactionBuilderFactory.getBuilder(
      thunkApi,
      account,
      draftTransaction.transactionParams.network.network,
      draftTransaction.transactionParams,
    );

    await transactionBuilder.buildTransaction();

    // Confirmation to be displayed on snap
    const signedTransaction = await transactionBuilder.signTransaction();
    return await transactionBuilder.sendTransaction(signedTransaction);
  },
);

export const multichainSendSlice = createSlice({
  name: 'multichainSend',
  initialState: initialMultichainSendState,
  reducers: {
    addNewDraft: (
      state,
      action: {
        payload: {
          account: InternalAccount;
          network: CaipChainId;
        };
      },
    ) => {
      const transactionId = uuidv4();
      state.currentTransactionUUID = transactionId;

      const { account, network } = action.payload;

      // @ts-expect-error TODO: fix type error
      state.draftTransactions[state.currentTransactionUUID] = {
        ...initialMultichainDraftTransaction,
        id: transactionId,
        transactionParams: {
          ...initialMultichainDraftTransaction.transactionParams,
          network: {
            network,
            error: '',
          },
          sender: {
            id: account.id,
            address: account.address,
          },
        },
      };
    },
    editTransaction: (
      state,
      action: {
        payload: Partial<TransactionParams>;
      },
    ) => {
      // No known transaction to edit
      if (!state.currentTransactionUUID) {
        return;
      }

      const { transactionParams: existingTransactionParams } =
        state.draftTransactions[state.currentTransactionUUID];

      state.draftTransactions[state.currentTransactionUUID].transactionParams =
        {
          ...existingTransactionParams,
          ...action.payload,
          sendAsset: {
            ...existingTransactionParams.sendAsset,
            ...(action.payload?.sendAsset ?? {}),
          },
          receiveAsset: {
            ...existingTransactionParams.receiveAsset,
            ...(action.payload.receiveAsset ?? {}),
          },
          recipient: {
            ...existingTransactionParams.recipient,
            ...(action.payload?.recipient ?? {}),
          },
          fee: {
            ...existingTransactionParams.fee,
            ...(action.payload?.fee ?? {}),
          },
        };
      multichainSendSlice.caseReducers.validateChecks(state);
    },
    clearDraft: (state) => {
      state.draftTransactions = {};
      state.currentTransactionUUID = '';
      state.stage = SendStage.DRAFT;
    },
    updateSendAmount: (state, action: { payload: string }) => {
      if (!state.currentTransactionUUID) {
        return;
      }
      const draftTransaction =
        state.draftTransactions[state.currentTransactionUUID];

      // convert hex to decimal string
      draftTransaction.transactionParams.sendAsset.amount = parseInt(
        action.payload,
        16,
      ).toString();
      // Once amount has changed, validate the field
      multichainSendSlice.caseReducers.validateAmountField(state);
      multichainSendSlice.caseReducers.validateChecks(state);
    },
    validateAmountField: (state) => {
      if (!state.currentTransactionUUID) {
        return;
      }
      const draftTransaction =
        state.draftTransactions[state.currentTransactionUUID];

      if (draftTransaction.transactionParams.sendAsset.amount === '') {
        draftTransaction.transactionParams.sendAsset.error =
          NEGATIVE_OR_ZERO_AMOUNT_TOKENS_ERROR;
        draftTransaction.transactionParams.sendAsset.valid = false;

        return;
      }

      if (draftTransaction.transactionParams.sendAsset.amount === '0') {
        draftTransaction.transactionParams.sendAsset.error =
          NEGATIVE_OR_ZERO_AMOUNT_TOKENS_ERROR;
        draftTransaction.transactionParams.sendAsset.valid = false;
        return;
      }

      const amount = new BigNumber(
        draftTransaction.transactionParams.sendAsset.amount,
      );
      const balance = new BigNumber(
        draftTransaction.transactionParams.sendAsset.assetDetails.balance,
      ).times(
        new BigNumber(10).pow(
          draftTransaction.transactionParams.sendAsset.assetDetails.details
            .decimals,
        ),
      );

      if (amount.greaterThan(balance)) {
        draftTransaction.transactionParams.sendAsset.error =
          INSUFFICIENT_FUNDS_ERROR;
        draftTransaction.transactionParams.sendAsset.valid = false;
        return;
      }

      const amountWithGas = amount.plus(
        new BigNumber(draftTransaction.transactionParams.fee.fee),
      );

      if (amountWithGas.greaterThan(balance)) {
        draftTransaction.transactionParams.sendAsset.error =
          INSUFFICIENT_FUNDS_FOR_GAS_ERROR;
        draftTransaction.transactionParams.sendAsset.valid = false;
        return;
      }

      draftTransaction.transactionParams.sendAsset.error = '';
      draftTransaction.transactionParams.sendAsset.valid = true;
    },
    validateChecks: (state) => {
      if (!state.currentTransactionUUID) {
        return;
      }
      state.draftTransactions[state.currentTransactionUUID].valid = false;

      // checks the transaction params for each field
      const { transactionParams } =
        state.draftTransactions[state.currentTransactionUUID];

      if (
        transactionParams.sendAsset.valid &&
        transactionParams.recipient.valid &&
        transactionParams.fee.valid
      ) {
        state.draftTransactions[state.currentTransactionUUID].valid = true;
      }
    },
    updateStage: (state, action: { payload: { stage: SendStage } }) => {
      state.stage = action.payload.stage;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(initializeSendState.fulfilled, (state, action) => {
        state.draftTransactions[action.payload.id].transactionParams =
          action.payload.transactionParams;
      })
      .addCase(estimateFee.pending, (state) => {
        if (!state.currentTransactionUUID) {
          return;
        }

        state.draftTransactions[
          state.currentTransactionUUID
        ].transactionParams.fee = {
          ...state.draftTransactions[state.currentTransactionUUID]
            .transactionParams.fee,
          error: '',
          isLoading: true,
          valid: false,
        };
      })
      .addCase(estimateFee.fulfilled, (state, action) => {
        if (!state.currentTransactionUUID) {
          return;
        }

        state.draftTransactions[
          state.currentTransactionUUID
        ].transactionParams.fee = {
          ...state.draftTransactions[state.currentTransactionUUID]
            .transactionParams.fee,
          error: '',
          valid: true,
          isLoading: false,
          fee: action.payload.fee,
          unit: action.payload.unit,
          confirmationTime: action.payload.confirmationTime,
        };
        multichainSendSlice.caseReducers.validateChecks(state);
      })
      .addCase(estimateFee.rejected, (state, action) => {
        if (!state.currentTransactionUUID) {
          return;
        }

        state.draftTransactions[
          state.currentTransactionUUID
        ].transactionParams.fee = {
          ...state.draftTransactions[state.currentTransactionUUID]
            .transactionParams.fee,
          error: `[Multichain Send Fee Error]: ${action.error}`,
          isLoading: false,
          valid: false,
        };
      })
      .addCase(updateAndValidateRecipient.fulfilled, (state, action) => {
        if (!state.currentTransactionUUID) {
          return;
        }

        state.draftTransactions[
          state.currentTransactionUUID
        ].transactionParams.recipient = action.payload;

        multichainSendSlice.caseReducers.validateChecks(state);
      })
      .addCase(setMaxSendAssetAmount.pending, (state) => {
        if (!state.currentTransactionUUID) {
          return;
        }

        state.draftTransactions[
          state.currentTransactionUUID
        ].transactionParams.sendAsset.error = '';
        state.draftTransactions[
          state.currentTransactionUUID
        ].transactionParams.sendAsset.valid = true;
      })
      .addCase(setMaxSendAssetAmount.fulfilled, (state, action) => {
        if (!state.currentTransactionUUID) {
          return;
        }

        state.draftTransactions[
          state.currentTransactionUUID
        ].transactionParams.sendAsset.amount = action.payload;
        multichainSendSlice.caseReducers.validateAmountField(state);
      })
      .addCase(setMaxSendAssetAmount.rejected, (state) => {
        if (!state.currentTransactionUUID) {
          return;
        }

        state.draftTransactions[
          state.currentTransactionUUID
        ].transactionParams.sendAsset.error =
          messages.setMaxAmountError.message;
        state.draftTransactions[
          state.currentTransactionUUID
        ].transactionParams.sendAsset.valid = false;
      })
      .addCase(signAndSend.pending, (state) => {
        if (!state.currentTransactionUUID) {
          return;
        }

        state.stage = SendStage.PUBLISHING;
      })
      .addCase(signAndSend.fulfilled, (state, _payload) => {
        if (!state.currentTransactionUUID) {
          return;
        }

        // TODO: do something with the transaction hash after it is sent

        state.stage = SendStage.PUBLISHED;
        multichainSendSlice.caseReducers.clearDraft(state);
      })
      .addCase(signAndSend.rejected, (state, action) => {
        state.stage = SendStage.FAILURE;
        state.error = action.error.message ?? 'Unknown error';
      });
  },
});

const { actions } = multichainSendSlice;

export const {
  addNewDraft,
  editTransaction,
  clearDraft,
  updateSendAmount,
  updateStage,
  validateAmountField,
  validateChecks,
} = actions;

export default multichainSendSlice.reducer;

export const startNewMultichainDraftTransaction = ({
  account,
  network,
}: {
  account: InternalAccount;
  network: CaipChainId;
}) => {
  // TODO: fix any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return async (dispatch: any) => {
    await dispatch(initializeSendState({ account, network }));

    // perform any other needed async actions
  };
};
