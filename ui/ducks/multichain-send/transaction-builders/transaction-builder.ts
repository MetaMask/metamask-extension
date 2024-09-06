import { CaipChainId } from '@metamask/utils';
import { AnyAction } from 'redux';
import { InternalAccount } from '@metamask/keyring-api';
import { GetThunkAPI } from '@reduxjs/toolkit/dist/createAsyncThunk';
import { MultichainNetworks } from '../../../../shared/constants/multichain/networks';
import { MultichainSendState, TransactionParams } from '../multichain-send';
import { BitcoinTransactionBuilder } from './bitcoin-transaction-builder';
import { AbstractTransactionBuilder } from './abstract-transaction-builder';

export class TransactionBuilderFactory {
  static getBuilder(
    thunkApi: GetThunkAPI<{
      state: MultichainSendState;
      dispatch: (action: AnyAction) => void;
    }>,
    account: InternalAccount,
    network: CaipChainId,
    transactionParams: TransactionParams,
  ): AbstractTransactionBuilder {
    switch (network) {
      case MultichainNetworks.BITCOIN_TESTNET:
      case MultichainNetworks.BITCOIN: {
        return new BitcoinTransactionBuilder(
          thunkApi,
          account,
          network,
          transactionParams,
        );
      }
      default:
        throw new Error(`Unsupported network: ${network}`);
    }
  }
}
