import { CaipAssetId, InternalAccount } from '@metamask/keyring-api';
import { GetThunkAPI } from '@reduxjs/toolkit/dist/createAsyncThunk';
import { Dispatch, AnyAction } from 'redux';
import {
  MultichainSendState,
  TransactionParams,
  DraftTransaction,
  FeeLevel,
} from '../../multichain-send';
import { AbstractTransactionBuilder } from '../abstract-transaction-builder';
import { AssetType } from '../../../../../shared/constants/transaction';

export class MockTransactionBuilder extends AbstractTransactionBuilder {
  protected network: `${string}:${string}` = 'mock:mock';

  protected account: InternalAccount = {} as InternalAccount;

  protected thunkApi = {} as GetThunkAPI<object>;

  protected transactionParams: TransactionParams = {} as TransactionParams;

  async estimateGas(): Promise<DraftTransaction['transactionParams']['fee']> {
    return {
      fee: '222222',
      unit: 'mock',
      feeInFiat: '$1.00',
      feeLevel: FeeLevel.Average,
      confirmationTime: '1 minute',
      isLoading: false,
      error: '',
      valid: true,
    };
  }

  async queryAssetBalance(
    address: string,
  ): Promise<{ amount: string; unit: string }> {
    return {
      amount: '222222',
      unit: 'mock',
    };
  }

  validateTransaction(): boolean {
    throw new Error('Method not implemented.');
  }

  setSendAsset(
    asset?: CaipAssetId,
  ): DraftTransaction['transactionParams']['sendAsset'] {
    return {
      amount: '0',
      asset: 'mock:mock',
      assetDetails: {
        type: AssetType.native,
        balance: '10000000',
        details: { decimals: 8 },
        image: '',
        symbol: 'mock-ticker',
      },
      valid: false,
      error: '',
    };
  }

  setNetwork(
    network: string,
  ): DraftTransaction['transactionParams']['network'] {
    throw new Error('Method not implemented.');
  }

  setFee(
    fee: FeeLevel,
  ): Promise<
    MultichainSendState['draftTransactions'][string]['transactionParams']['fee']
  > {
    throw new Error('Method not implemented.');
  }

  setRecipient(
    recipient: string,
  ): DraftTransaction['transactionParams']['recipient'] {
    throw new Error('Method not implemented.');
  }

  setAmount(
    amount: string,
  ): DraftTransaction['transactionParams']['sendAsset'] {
    throw new Error('Method not implemented.');
  }

  buildTransaction(): void {
    throw new Error('Method not implemented.');
  }

  signTransaction(): Promise<string> {
    throw new Error('Method not implemented.');
  }

  sendTransaction(): Promise<string> {
    throw new Error('Method not implemented.');
  }

  setMaxSendAmount(): Promise<string> {
    throw new Error('Method not implemented.');
  }
}
