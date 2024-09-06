import { v4 as uuidv4 } from 'uuid';
import BigNumber from 'bignumber.js';
import {
  AnyAction,
  createAsyncThunk,
  createSlice,
  Dispatch,
} from '@reduxjs/toolkit';
import { CaipAccountAddress, CaipChainId } from '@metamask/utils';
import { CaipAssetId, InternalAccount } from '@metamask/keyring-api';
import { Asset, SEND_STATUSES } from '../send';
import { MultichainNetworks } from '../../../shared/constants/multichain/networks';
import { getMultichainNetwork } from '../../selectors/multichain';
import { AssetType } from '../../../shared/constants/transaction';
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
    assetDetails: Asset;
    // Required for assets that require denominatinos (e.g. cosmos)
    denominatinon?: string;
    error: string;
  };
  receiveAsset: {
    amount: string;
    // CAIP-19 asset identifier
    asset: CaipAssetId;
    // Required for assets that require denominatinos (e.g. cosmos)
    denominatinon?: string;
    error: string;
  };
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
};

export type DraftTransaction = {
  transactionParams: TransactionParams;
  transaction: SendManyTransaction | null;
  valid: boolean;
};

export type MultichainSendState = {
  currentTransactionUUID: string | undefined;
  draftTransactions: {
    [key: string]: DraftTransaction;
  };
  status: typeof SEND_STATUSES;
  // stage: typeof SEND_STAGES;
};

const initialState: MultichainSendState = {
  currentTransactionUUID: undefined,
  draftTransactions: {},
  status: SEND_STATUSES,
  // stage: SEND_STAGES.DRAFT,
};

const initialDraftTransaction: DraftTransaction = {
  transactionParams: {
    sender: {
      id: '',
      address: '',
    },
    sendAsset: {
      amount: '0',
      assetDetails: {
        type: AssetType.native,
        balance: '0',
        error: '',
      },
      asset: undefined,
      denominatinon: undefined,
      error: '',
    },
    receiveAsset: {
      amount: '0',
      asset: undefined,
      denominatinon: undefined,
      error: '',
    },
    recipient: {
      address: '',
      valid: false,
      error: '',
    },
    fee: {
      error: '',
      isLoading: false,
      fee: '',
      unit: '',
      confirmationTime: '',
      feeInFiat: '',
      feeLevel: FeeLevel.Average,
    },
    network: {
      network: MultichainNetworks.BITCOIN,
      error: '',
    },
  },
  transaction: null,
  valid: false,
};

export type MultichainSendAsyncThunkConfig = {
  state: MultichainSendState;
  dispatch: Dispatch<AnyAction>;
};

export const initializeSendState = createAsyncThunk<
  { id: string; transactionParams: TransactionParams },
  { account: InternalAccount; network: CaipChainId },
  {
    state: MultichainSendState;
    dispatch: Dispatch<AnyAction>;
    rejectValue: {
      error: string;
    };
  }
>(
  'multichainSend/initializeSendState',
  async ({ account, network }, thunkApi) => {
    // Create a new draft
    // thunkApi.dispatch(actions.addNewDraft({ account, network }));
    thunkApi.dispatch({
      type: 'multichainSend/addNewDraft',
      payload: {
        account,
        network,
      },
    });

    const state = thunkApi.getState();

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

    // set asset
    const sendAsset = transactionBuilder.setSendAsset();
    console.log('sendAsset', sendAsset);
    // const fee = await transactionBuilder.setFee(FeeLevel.Average);
    // console.log('fee', fee);
    const balance = await transactionBuilder.queryAssetBalance(sendAsset.asset);
    console.log('balance', balance);

    const updatedTransactionParams = {
      ...draftTransaction.transactionParams,
      sendAsset: {
        ...draftTransaction.transactionParams.sendAsset,
        ...sendAsset,
        balance: balance.amount,
      },
      // fee: {
      //   ...draftTransaction.transactionParams.fee,
      //   ...fee,
      // },
    };

    console.log('updatedTransactionParams', updatedTransactionParams);

    return {
      id: state.multichainSend.currentTransactionUUID,
      transactionParams: updatedTransactionParams,
    };
  },
);

export const estimateFee = createAsyncThunk<
  {
    unit: string;
    fee: string;
  },
  { account: InternalAccount; transactionParams: TransactionParams },
  {
    state: MultichainSendState;
    dispatch: Dispatch<AnyAction>;
    rejectValue: { error: string };
  }
>(
  'multichainSend/estimateFee',
  async ({ account, transactionParams }, thunkApi) => {
    const state = thunkApi.getState();
    // @ts-expect-error TODO: fix type error
    const multichainNetwork = getMultichainNetwork(state, account);

    const transactionBuilder = TransactionBuilderFactory.getBuilder(
      thunkApi,
      account,
      multichainNetwork.chainId,
      transactionParams ?? initialDraftTransaction.transactionParams,
    );

    const fee = await transactionBuilder.estimateGas();
    return fee;
  },
);

// Using async because of possible network requests asscoiated with updating the recipient
export const updateAndValidateRecipient = createAsyncThunk<
  DraftTransaction['transactionParams']['recipient'],
  {
    account: InternalAccount;
    transactionParams: TransactionParams;
    recipient: string;
  },
  {
    state: MultichainSendState;
    dispatch: Dispatch<AnyAction>;
    rejectValue: { error: string };
  }
>(
  'multichainSend/updateAndValidateRecipient',
  async ({ account, transactionParams, recipient }, thunkApi) => {
    const state = thunkApi.getState();
    // @ts-expect-error TODO: fix type error
    const multichainNetwork = getMultichainNetwork(state, account);

    const transactionBuilder = TransactionBuilderFactory.getBuilder(
      thunkApi,
      account,
      multichainNetwork.chainId,
      transactionParams,
    );

    const updatedRecipient = transactionBuilder.setRecipient(recipient);
    return updatedRecipient;
  },
);

const slice = createSlice({
  name: 'multichainSend',
  initialState,
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
      state.currentTransactionUUID = uuidv4();

      const { account, network } = action.payload;

      state.draftTransactions[state.currentTransactionUUID] = {
        ...initialDraftTransaction,
        transactionParams: {
          ...initialDraftTransaction.transactionParams,
          network: {
            network,
            error: '',
          },
        },
      };
      state.draftTransactions[
        state.currentTransactionUUID
      ].transactionParams.sender = {
        id: account.id,
        address: account.address,
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
    },
    clearDraft: (state) => {
      state.draftTransactions = {};
      state.currentTransactionUUID = undefined;
    },
    updateSendAmount: (state, action) => {
      if (!state.currentTransactionUUID) {
        return;
      }
      const draftTransaction =
        state.draftTransactions[state.currentTransactionUUID];

      draftTransaction.transactionParams.sendAsset.amount = action.payload;
      // Once amount has changed, validate the field
      slice.caseReducers.validateAmountField(state);
    },
    validateAmountField: (state) => {
      if (!state.currentTransactionUUID) {
        return;
      }
      const draftTransaction =
        state.draftTransactions[state.currentTransactionUUID];

      if (draftTransaction.transactionParams.sendAsset.amount === '') {
        draftTransaction.transactionParams.sendAsset.error =
          'Amount cannot be empty';
        draftTransaction.valid = false;
        return;
      }

      if (draftTransaction.transactionParams.sendAsset.amount === '0') {
        draftTransaction.transactionParams.sendAsset.error =
          'Amount cannot be zero';
        draftTransaction.valid = false;
        return;
      }

      const amount = new BigNumber(
        draftTransaction.transactionParams.sendAsset.amount,
      );
      const balance = new BigNumber(
        draftTransaction.transactionParams.sendAsset.assetDetails.balance,
      );

      if (amount.greaterThan(balance)) {
        draftTransaction.transactionParams.sendAsset.error =
          'Insufficient balance';
        draftTransaction.valid = false;
        return;
      }

      draftTransaction.transactionParams.sendAsset.error = '';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(initializeSendState.fulfilled, (state, action) => {
        console.log('initializeSendState.fulfilled', state, action);
        state.draftTransactions[action.payload.id].transactionParams =
          action.payload.transactionParams;
      })
      .addCase(initializeSendState.rejected, (state, action) => {
        console.log('initializeSendState.rejected', state, action);
      })
      .addCase(initializeSendState.pending, (state, action) => {
        console.log('initializeSendState.pending', state, action);
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
        };
      })
      .addCase(
        estimateFee.fulfilled,
        // (state, { payload }: PayloadAction<{ fee: string; unit: string }>) => {
        (state, action) => {
          if (!state.currentTransactionUUID) {
            return;
          }

          state.draftTransactions[
            state.currentTransactionUUID
          ].transactionParams.fee = {
            ...state.draftTransactions[state.currentTransactionUUID]
              .transactionParams.fee,
            error: '',
            isLoading: false,
            fee: action.payload.fee,
            unit: action.payload.unit,
          };
        },
      )
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
        };
      })
      .addCase(updateAndValidateRecipient.pending, (state) => {
        // TODO:
      })
      .addCase(updateAndValidateRecipient.fulfilled, (state, action) => {
        console.log('finished updating recipient', action);
        if (!state.currentTransactionUUID) {
          return;
        }

        state.draftTransactions[
          state.currentTransactionUUID
        ].transactionParams.recipient = action.payload;
      });
  },
});

const { actions, reducer } = slice;

export const { addNewDraft, editTransaction, clearDraft, updateSendAmount } =
  actions;
export default slice.reducer;

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
