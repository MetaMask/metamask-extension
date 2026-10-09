import { errorCodes } from '@metamask/rpc-errors';
import { TransactionType } from '@metamask/transaction-controller';
import type { Hex } from '@metamask/utils';
import type { MmPayRpcMessenger } from '../types';
import { perpsWithdrawTypeRegistry } from './perps-withdraw';

jest.mock('@metamask/perps-controller', () => ({
  ...jest.requireActual(
    '@metamask/perps-controller/constants/hyperLiquidConfig',
  ),
  ...jest.requireActual('@metamask/perps-controller/utils/transferData'),
}));

const FROM = '0x1234567890abcdef1234567890abcdef12345678' as Hex;
const OTHER = '0x0000000000000000000000000000000000000001' as Hex;
const ARBITRUM_USDC = '0xaf88d065e77c8cC2239327C5EDb3A432268e5831';

function createMessenger({
  selectedAddress = FROM as string,
  isEligible = true,
} = {}) {
  const call = jest.fn((action: string) => {
    switch (action) {
      case 'AccountsController:getSelectedAccount':
        return { address: selectedAddress };
      case 'PerpsController:getState':
        return { isEligible };
      default:
        return undefined;
    }
  });

  return { messenger: { call } as unknown as MmPayRpcMessenger, call };
}

describe('perpsWithdrawTypeRegistry', () => {
  describe('assertPreconditions', () => {
    it('passes for the selected account', async () => {
      const { messenger } = createMessenger();

      expect(
        await perpsWithdrawTypeRegistry.assertPreconditions({
          from: FROM,
          messenger,
        }),
      ).toBeUndefined();
    });

    it('passes for the selected account in different casing', async () => {
      const { messenger } = createMessenger({
        selectedAddress: FROM.toUpperCase().replace('0X', '0x'),
      });

      expect(
        await perpsWithdrawTypeRegistry.assertPreconditions({
          from: FROM,
          messenger,
        }),
      ).toBeUndefined();
    });

    it('rejects a connected account that is not selected', async () => {
      const { messenger } = createMessenger({ selectedAddress: OTHER });

      await expect(
        perpsWithdrawTypeRegistry.assertPreconditions({
          from: FROM,
          messenger,
        }),
      ).rejects.toMatchObject({
        code: errorCodes.provider.unauthorized,
        message: expect.stringContaining('selected'),
      });
    });

    it('rejects when not eligible for perps', async () => {
      const { messenger } = createMessenger({ isEligible: false });

      await expect(
        perpsWithdrawTypeRegistry.assertPreconditions({
          from: FROM,
          messenger,
        }),
      ).rejects.toMatchObject({
        code: errorCodes.rpc.methodNotSupported,
        data: { reason: 'perpsNotEligible' },
      });
    });

    it('checks the selected account before eligibility', async () => {
      const { messenger, call } = createMessenger({
        selectedAddress: OTHER,
        isEligible: false,
      });

      await expect(
        perpsWithdrawTypeRegistry.assertPreconditions({
          from: FROM,
          messenger,
        }),
      ).rejects.toMatchObject({ code: errorCodes.provider.unauthorized });
      expect(call).not.toHaveBeenCalledWith('PerpsController:getState');
    });
  });

  it('builds a USDC transfer to from on Arbitrum', () => {
    expect(
      perpsWithdrawTypeRegistry.build({
        from: FROM,
        payParams: { amount: '5' },
      }),
    ).toStrictEqual({
      chainId: '0xa4b1',
      transactionParams: {
        from: FROM,
        to: ARBITRUM_USDC,
        value: '0x0',
        data: `0xa9059cbb${FROM.slice(2).padStart(64, '0')}${'4c4b40'.padStart(64, '0')}`,
      },
      type: TransactionType.perpsWithdraw,
    });
  });

  it('validates payParams with the shared perps rules', () => {
    expect(() =>
      perpsWithdrawTypeRegistry.validatePayParams({ amount: '-1' }),
    ).toThrow(expect.objectContaining({ code: errorCodes.rpc.invalidParams }));
  });
});
