import { BtcAccountType } from '@metamask/keyring-api';
import { Dispatch, AnyAction } from 'redux';
import { GetThunkAPI } from '@reduxjs/toolkit/dist/createAsyncThunk';
import { createMockInternalAccount } from '../../../../test/jest/mocks';
import { MultichainNetworks } from '../../../../shared/constants/multichain/networks';
import {
  initialMultichainDraftTransaction,
  MultichainSendState,
} from '../multichain-send';
import { BitcoinTransactionBuilder } from './bitcoin-transaction-builder';

const mockDispatch = jest.fn();
const mockGetState = jest.fn();

const mockThunkApi: GetThunkAPI<{
  state: { multichainSend: MultichainSendState };
  dispatch: Dispatch<AnyAction>;
}> = {
  dispatch: mockDispatch,
  getState: mockGetState,
  extra: {},
  requestId: '',
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  signal: {} as any,
  rejectWithValue: jest.fn(),
  fulfillWithValue: jest.fn(),
  abort(_reason?: string): void {
    throw new Error('Function not implemented.');
  },
};

const mockBtcAccount = createMockInternalAccount({
  name: 'Btc Account',
  address: 'bc1qa4muxuheal3suc3hyn9d8k45urqsc4tj2n7c6x',
  type: BtcAccountType.P2wpkh,
});

const mockTransactionParams =
  initialMultichainDraftTransaction.transactionParams;

describe('BitcoinTransactionBuilder', () => {
  let builder: BitcoinTransactionBuilder;

  beforeEach(() => {
    // Initialize the builder with mock data
    builder = new BitcoinTransactionBuilder(
      mockThunkApi,
      mockBtcAccount,
      MultichainNetworks.BITCOIN,
      mockTransactionParams,
    );
  });

  it('should set the amount correctly', () => {
    const amount = '0.01';
    const result = builder.setAmount(amount);

    expect(result.amount).toEqual(amount);
  });
});
