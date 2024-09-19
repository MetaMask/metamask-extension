import { CaipAssetId, InternalAccount } from '@metamask/keyring-api';
import { GetThunkAPI } from '@reduxjs/toolkit/dist/createAsyncThunk';
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
      feeInFiat: '',
      feeLevel: FeeLevel.Average,
      confirmationTime: '1 minute',
      isLoading: false,
      error: '',
      valid: true,
    };
  }

  async queryAssetBalance(
    _address: string,
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
    _asset?: CaipAssetId,
  ): DraftTransaction['transactionParams']['sendAsset'] {
    return {
      amount: '0',
      asset: 'mock:mock',
      assetDetails: {
        type: AssetType.native,
        balance: '10000000',
        details: { decimals: 8 },
        // @ts-expect-error no image for mock
        image: '',
        symbol: 'mock-ticker',
      },
      valid: false,
      error: '',
    };
  }

  setNetwork(
    _network: string,
  ): DraftTransaction['transactionParams']['network'] {
    throw new Error('Method not implemented.');
  }

  setFee(
    _fee: FeeLevel,
  ): Promise<
    MultichainSendState['draftTransactions'][string]['transactionParams']['fee']
  > {
    return Promise.resolve({
      fee: '222222',
      unit: 'mock',
      feeInFiat: '',
      feeLevel: FeeLevel.Average,
      confirmationTime: '1 minute',
      isLoading: false,
      error: '',
      valid: true,
    });
  }

  setRecipient(
    recipient: string,
  ): DraftTransaction['transactionParams']['recipient'] {
    if (recipient === 'mock') {
      throw new Error('Invalid recipient');
    }

    return {
      address: recipient,
      valid: true,
      error: '',
    };
  }

  setAmount(
    _amount: string,
  ): DraftTransaction['transactionParams']['sendAsset'] {
    throw new Error('Method not implemented.');
  }

  buildTransaction(): void {
    // do nothing
  }

  signTransaction(): Promise<string> {
    return Promise.resolve('mock');
  }

  sendTransaction(): Promise<string> {
    return Promise.resolve('mock');
  }

  setMaxSendAmount(): Promise<string> {
    return Promise.resolve('333333');
  }
}
