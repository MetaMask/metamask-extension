import type { TransactionParams } from '@metamask/transaction-controller';

import { GAS_SPONSORSHIP_VAULT_ADDRESS_BASE } from '../../../../shared/constants/gas-sponsorship';
import { estimateGasSponsorshipAmount } from './gas-sponsorship-estimator';

const TX_FROM_MOCK = '0x12345678901234567890123456789012345678ab';

describe('estimateGasSponsorshipAmount', () => {
  it('estimates sponsorship amount with buffer', async () => {
    const requestMock = jest.fn(async ({ method }) => {
      if (method === 'eth_call') {
        return '0x0000000000000000000000001234567890123456789012345678901234567890';
      }

      if (method === 'eth_estimateGas') {
        return '0xc350';
      }

      throw new Error(`Unhandled method: ${String(method)}`);
    });

    const result = await estimateGasSponsorshipAmount({
      bufferBps: 3500,
      campaignId:
        '0x15a3519b47bfd10994040bdf9cfe7e3b069ca673e64e0a1098e5528a3eb89606',
      vaultAddress: GAS_SPONSORSHIP_VAULT_ADDRESS_BASE,
      networkClientId: 'mainnet',
      txParams: {
        from: TX_FROM_MOCK,
        gas: '0x5208',
        maxFeePerGas: '0x2',
      } as TransactionParams,
      getNetworkClientById: () => ({
        provider: {
          request: requestMock,
        },
      }),
    });

    expect(result.amountWei).toBe(191700n);
    expect(result.diagnostics.settleTxGasLimit).toBe('50000');
    expect(result.diagnostics.settleTxFrom).toBe(TX_FROM_MOCK);
    expect(requestMock).toHaveBeenCalledWith({
      method: 'eth_estimateGas',
      params: [
        expect.objectContaining({
          from: TX_FROM_MOCK,
        }),
      ],
    });
  });

  it('throws if tx gas params are missing', async () => {
    await expect(
      estimateGasSponsorshipAmount({
        bufferBps: 3500,
        campaignId:
          '0x15a3519b47bfd10994040bdf9cfe7e3b069ca673e64e0a1098e5528a3eb89606',
        vaultAddress: GAS_SPONSORSHIP_VAULT_ADDRESS_BASE,
        networkClientId: 'mainnet',
        txParams: {} as TransactionParams,
        getNetworkClientById: () => ({
          provider: {
            request: jest.fn(),
          },
        }),
      }),
    ).rejects.toThrow('Invalid userTxGasLimit');
  });
});
