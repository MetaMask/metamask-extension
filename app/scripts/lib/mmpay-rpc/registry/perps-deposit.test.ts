import { errorCodes } from '@metamask/rpc-errors';
import { TransactionType } from '@metamask/transaction-controller';
import type { Hex } from '@metamask/utils';
import type { MmPayRpcMessenger } from '../types';
import { perpsDepositTypeRegistry } from './perps-deposit';

jest.mock('@metamask/perps-controller', () => ({
  ...jest.requireActual(
    '@metamask/perps-controller/constants/hyperLiquidConfig',
  ),
  ...jest.requireActual('@metamask/perps-controller/utils/transferData'),
}));

const FROM = '0x1234567890123456789012345678901234567890' as Hex;
const ARBITRUM_USDC = '0xaf88d065e77c8cC2239327C5EDb3A432268e5831';
const BRIDGE_ARG =
  '0000000000000000000000002df1c51e09aecf9cacb7bc98cb1742757f163df7';

describe('perpsDepositTypeRegistry', () => {
  it('builds a USDC transfer to the Hyperliquid bridge on Arbitrum', () => {
    expect(
      perpsDepositTypeRegistry.build({
        from: FROM,
        payParams: { amount: '10' },
      }),
    ).toStrictEqual({
      chainId: '0xa4b1',
      transactionParams: {
        from: FROM,
        to: ARBITRUM_USDC,
        value: '0x0',
        data: `0xa9059cbb${BRIDGE_ARG}${'989680'.padStart(64, '0')}`,
        gas: '0x186a0',
      },
      type: TransactionType.perpsDeposit,
      skipInitialGasEstimate: true,
    });
  });

  it('encodes a zero amount when none is given', () => {
    const { transactionParams } = perpsDepositTypeRegistry.build({
      from: FROM,
      payParams: {},
    });

    expect(transactionParams.data).toBe(
      `0xa9059cbb${BRIDGE_ARG}${'0'.repeat(64)}`,
    );
  });

  it('validates payParams with the shared perps rules', () => {
    expect(
      perpsDepositTypeRegistry.validatePayParams({ amount: '1' }),
    ).toStrictEqual({ amount: '1' });
    expect(() =>
      perpsDepositTypeRegistry.validatePayParams({ amount: '0' }),
    ).toThrow(expect.objectContaining({ code: errorCodes.rpc.invalidParams }));
  });

  it('requires perps eligibility', async () => {
    const messenger = {
      call: jest.fn((action: string) =>
        action === 'PerpsController:getState'
          ? { isEligible: false }
          : undefined,
      ),
    } as unknown as MmPayRpcMessenger;

    await expect(
      perpsDepositTypeRegistry.assertPreconditions({ from: FROM, messenger }),
    ).rejects.toMatchObject({ code: errorCodes.rpc.methodNotSupported });
  });
});
