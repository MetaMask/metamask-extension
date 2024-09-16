import { TransactionBuilderFactory } from './transaction-builder';
import { MultichainSendState, TransactionParams } from '../multichain-send';
import { CaipChainId } from '@metamask/utils';
import { InternalAccount } from '@metamask/keyring-api';
import { AnyAction } from 'redux';
import { GetThunkAPI } from '@reduxjs/toolkit/dist/createAsyncThunk';
import { MultichainNetworks } from '../../../../shared/constants/multichain/networks';
import { AbstractTransactionBuilder } from './abstract-transaction-builder';
import { BitcoinTransactionBuilder } from './bitcoin-transaction-builder';

describe('TransactionBuilderFactory', () => {
  let thunkApi: GetThunkAPI<{
    state: { multichainSend: MultichainSendState };
    dispatch: (action: AnyAction) => void;
  }>;
  let account: InternalAccount;
  let network: CaipChainId;
  let transactionParams: TransactionParams;

  beforeEach(() => {
    thunkApi = {
      // @ts-expect-error mock
      state: { multichainSend: {} as MultichainSendState },
      dispatch: jest.fn(),
    };
    account = {} as InternalAccount;
    network = MultichainNetworks.BITCOIN;
    transactionParams = {} as TransactionParams;
  });

  describe('getBuilder', () => {
    it('should return an instance of AbstractTransactionBuilder', () => {
      const builder = TransactionBuilderFactory.getBuilder(
        thunkApi,
        account,
        network,
        transactionParams,
      );

      expect(builder).toBeInstanceOf(AbstractTransactionBuilder);
    });

    // @ts-expect-error This is missing from the Mocha type definitions
    it.each([
      {
        chainId: MultichainNetworks.BITCOIN,
        builder: BitcoinTransactionBuilder,
      },
      {
        chainId: MultichainNetworks.BITCOIN_TESTNET,
        builder: BitcoinTransactionBuilder,
      },
    ])(
      `it returns builder for $chainId`,
      ({
        chainId,
        builder,
      }: {
        chainId: MultichainNetworks;
        builder: AbstractTransactionBuilder;
      }) => {
        const transactionBuilder = TransactionBuilderFactory.getBuilder(
          thunkApi,
          account,
          chainId,
          transactionParams,
        );

        expect(transactionBuilder).toBeInstanceOf(builder);
      },
    );

    it('throws an error if the network is not supported', () => {
      network = 'unsupported' as CaipChainId;

      expect(() =>
        TransactionBuilderFactory.getBuilder(
          thunkApi,
          account,
          network,
          transactionParams,
        ),
      ).toThrow('Unsupported network: unsupported');
    });
  });
});
