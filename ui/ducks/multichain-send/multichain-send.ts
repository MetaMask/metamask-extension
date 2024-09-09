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
import { Json } from 'json-rpc-engine';
import { SEND_STATUSES } from '../send';
import { MultichainNetworks } from '../../../shared/constants/multichain/networks';
import { getMultichainNetwork } from '../../selectors/multichain';
import { AssetType } from '../../../shared/constants/transaction';
import { NativeAsset } from '../../components/multichain/asset-picker-amount/asset-picker-modal/types';
import {
  INSUFFICIENT_FUNDS_ERROR,
  NEGATIVE_OR_ZERO_AMOUNT_TOKENS_ERROR,
} from '../../pages/confirmations/send/send.constants';
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
  };
  receiveAsset: {
    amount: string;
    // CAIP-19 asset identifier
    asset: CaipAssetId;
    // Required for assets that require denominatinos (e.g. cosmos)
    denominatinon?: string;
    error: string;
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
};

export enum SendStage {
  DRAFT = 'draft',
  PUBLISHED = 'published',
}

export enum SendStatus {
  VALID = 'valid',
  INVALID = 'invalid',
}

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
  stage: SendStage;
};

const initialState: MultichainSendState = {
  currentTransactionUUID: undefined,
  draftTransactions: {},
  stage: SendStage.DRAFT,
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
        // @ts-expect-error TODO: create placeholder
        image: './images/placeholder.svg',
        symbol: '',
      },
      asset: '',
      denominatinon: undefined,
      error: '',
    },
    receiveAsset: {
      amount: '0',
      asset: '',
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
    data: {},
    network: {
      network: MultichainNetworks.BITCOIN,
      error: '',
    },
  },
  transaction: null,
  valid: false,
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
    state: { multichainSend: MultichainSendState };
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
        state.multichainSend.currentTransactionUUID as string // This was checked in the previous if statement
      ];

    const transactionBuilder = TransactionBuilderFactory.getBuilder(
      thunkApi,
      account,
      network,
      draftTransaction.transactionParams,
    );

    // set asset
    const sendAsset = transactionBuilder.setSendAsset();
    // const fee = await transactionBuilder.setFee(FeeLevel.Average);
    // console.log('fee', fee);
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
      // fee: {
      //   ...draftTransaction.transactionParams.fee,
      //   ...fee,
      // },
    };

    console.log('updatedTransactionParams', updatedTransactionParams);

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
    account: InternalAccount;
    transactionParams: TransactionParams;
    recipient: string;
  },
  {
    state: { multichainSend: MultichainSendState };
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

export const signAndSend = createAsyncThunk<
  void,
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

    // sign and send transaction
    // send to keyring / snap
    const txHash = await transactionBuilder.sendTransaction();
    console.log('txHash', txHash);

    thunkApi.dispatch({
      type: 'multichainSend/updateStage',
      payload: { stage: SendStage.PUBLISHED },
    });

    // propagate to network
    // thunkApi.dispatch(actions.updateStatus(SEND_STATUSES.SIGNING));

    // update stage
    // thunkApi.dispatch(actions.updateStage(SEND_STAGES.SIGNING));

    // update status
    // thunkApi.dispatch(actions.updateStatus(SEND_STATUSES.SENDING));

    // update stage
    // thunkApi.dispatch(actions.updateStage(SEND_STAGES.SENDING));
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

      // @ts-expect-error TODO: fix type error
      state.draftTransactions[state.currentTransactionUUID] = {
        ...initialDraftTransaction,
        transactionParams: {
          ...initialDraftTransaction.transactionParams,
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
      slice.caseReducers.validateChecks(state);
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

      // convert hex to decimal string
      draftTransaction.transactionParams.sendAsset.amount = parseInt(
        action.payload,
        16,
      ).toString();
      // Once amount has changed, validate the field
      slice.caseReducers.validateAmountField(state);
      slice.caseReducers.validateChecks(state);
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
        draftTransaction.valid = false;
        return;
      }

      if (draftTransaction.transactionParams.sendAsset.amount === '0') {
        draftTransaction.transactionParams.sendAsset.error =
          NEGATIVE_OR_ZERO_AMOUNT_TOKENS_ERROR;
        draftTransaction.valid = false;
        return;
      }

      const amount = new BigNumber(
        draftTransaction.transactionParams.sendAsset.amount,
      );
      const balance = new BigNumber(
        draftTransaction.transactionParams.sendAsset.assetDetails.balance,
      ).times(
        new BigNumber(
          draftTransaction.transactionParams.sendAsset.assetDetails.details.decimals,
        ).pow(10),
      );

      if (amount.greaterThan(balance)) {
        draftTransaction.transactionParams.sendAsset.error =
          INSUFFICIENT_FUNDS_ERROR;
        draftTransaction.valid = false;
        return;
      }

      draftTransaction.transactionParams.sendAsset.error = '';
    },
    validateChecks: (state) => {
      if (!state.currentTransactionUUID) {
        return;
      }

      // checks the transaction params for each field
      const { transactionParams } =
        state.draftTransactions[state.currentTransactionUUID];

      if (
        !transactionParams.sendAsset.error &&
        !transactionParams.recipient.error &&
        !transactionParams.fee.error
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
          isLoading: false,
          fee: action.payload.fee,
          unit: action.payload.unit,
          confirmationTime: action.payload.confirmationTime,
        };
        slice.caseReducers.validateChecks(state);
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
        };
      })
      .addCase(updateAndValidateRecipient.pending, (state) => {
        // TODO:
      })
      .addCase(updateAndValidateRecipient.fulfilled, (state, action) => {
        if (!state.currentTransactionUUID) {
          return;
        }

        state.draftTransactions[
          state.currentTransactionUUID
        ].transactionParams.recipient = action.payload;

        slice.caseReducers.validateChecks(state);
      });
  },
});

const { actions } = slice;

export const {
  addNewDraft,
  editTransaction,
  clearDraft,
  updateSendAmount,
  updateStage,
} = actions;
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
