import { TransactionType } from '@metamask/transaction-controller';

import { CHAIN_IDS } from '../../../../../shared/constants/network';
import {
  addTransaction,
  findNetworkClientIdByChainId,
} from '../../../../store/actions';
import { ARBITRUM_USDC } from '../../../../pages/confirmations/constants/perps';
import { createPerpsWithdrawTransaction } from './createPerpsWithdrawTransaction';

jest.mock('../../../../store/actions', () => ({
  addTransaction: jest.fn(),
  findNetworkClientIdByChainId: jest.fn(),
}));

const addTransactionMock = jest.mocked(addTransaction);
const findNetworkClientIdByChainIdMock = jest.mocked(
  findNetworkClientIdByChainId,
);

const MOCK_ACCOUNT_ADDRESS = '0x1234567890123456789012345678901234567890';
const MOCK_NETWORK_CLIENT_ID = 'arbitrum-mainnet';

describe('createPerpsWithdrawTransaction', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    findNetworkClientIdByChainIdMock.mockResolvedValue(
      MOCK_NETWORK_CLIENT_ID as never,
    );
    addTransactionMock.mockResolvedValue({ id: 'tx-123' } as never);
  });

  it('creates a perpsWithdraw transaction on Arbitrum and returns the id', async () => {
    const result = await createPerpsWithdrawTransaction({
      accountAddress: MOCK_ACCOUNT_ADDRESS,
    });

    expect(findNetworkClientIdByChainIdMock).toHaveBeenCalledWith(
      CHAIN_IDS.ARBITRUM,
    );
    expect(addTransactionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        from: MOCK_ACCOUNT_ADDRESS,
        to: ARBITRUM_USDC.address,
        value: '0x0',
        data: expect.stringMatching(/^0xa9059cbb/u),
      }),
      {
        networkClientId: MOCK_NETWORK_CLIENT_ID,
        type: TransactionType.perpsWithdraw,
      },
    );
    expect(result).toStrictEqual({ transactionId: 'tx-123' });
  });

  it('throws when the transaction is not created', async () => {
    addTransactionMock.mockResolvedValueOnce({} as never);

    await expect(
      createPerpsWithdrawTransaction({
        accountAddress: MOCK_ACCOUNT_ADDRESS,
      }),
    ).rejects.toThrow('Perps withdraw transaction was not created');
  });
});
