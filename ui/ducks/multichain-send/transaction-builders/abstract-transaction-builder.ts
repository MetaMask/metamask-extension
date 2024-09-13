import { CaipChainId } from '@metamask/utils';
import { AnyAction, Dispatch } from '@reduxjs/toolkit';
import { CaipAssetId, InternalAccount } from '@metamask/keyring-api';
import { GetThunkAPI } from '@reduxjs/toolkit/dist/createAsyncThunk';
import {
  DraftTransaction,
  FeeLevel,
  MultichainSendState,
  TransactionParams,
} from '../multichain-send';

export abstract class AbstractTransactionBuilder {
  protected network: CaipChainId;

  protected account: InternalAccount;

  protected thunkApi: GetThunkAPI<{
    state: { multichainSend: MultichainSendState };
    dispatch: Dispatch<AnyAction>;
  }>;

  // Transaction parameters
  // Concrete builders will use this to construct the transaction
  protected transactionParams: TransactionParams;

  constructor(
    thunkApi: GetThunkAPI<{
      state: { multichainSend: MultichainSendState };
      dispatch: Dispatch<AnyAction>;
    }>,
    account: InternalAccount,
    network: CaipChainId,
    transactionParams: TransactionParams,
  ) {
    this.thunkApi = thunkApi;
    this.account = account;
    this.network = network;
    this.transactionParams = transactionParams;
  }

  abstract estimateGas(): Promise<DraftTransaction['transactionParams']['fee']>;

  abstract queryAssetBalance(address: string): Promise<{
    amount: string;
    unit: string;
  }>;

  abstract validateTransaction(): boolean;

  // Defaults to network's native asset
  abstract setSendAsset(
    asset?: CaipAssetId,
  ): DraftTransaction['transactionParams']['sendAsset'];

  abstract setNetwork(
    network: string,
  ): DraftTransaction['transactionParams']['network'];

  abstract setFee(
    fee: FeeLevel,
  ): Promise<
    MultichainSendState['draftTransactions'][string]['transactionParams']['fee']
  >;

  abstract setRecipient(
    recipient: string,
  ): DraftTransaction['transactionParams']['recipient'];

  abstract setAmount(
    amount: string,
  ): DraftTransaction['transactionParams']['sendAsset'];

  abstract buildTransaction(): void;

  // The result should be the raw signed transaction
  abstract signTransaction(): Promise<string>;

  abstract sendTransaction(): Promise<string>;

  // The maximum amount the user can send after fees
  abstract setMaxSendAmount(): Promise<string>;
}
