import { renderHook } from '@testing-library/react-hooks';
import {
  TransactionMeta,
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import { Interface } from '@ethersproject/abi';
import { DISTRIBUTOR_CLAIM_ABI } from '../../../../components/app/musd/constants';
import * as merklClient from '../../../../components/app/musd/merkl-client';
import { useMerklClaimAmount } from './useMerklClaimAmount';

// Mock dependencies
jest.mock('react-redux', () => ({
  useSelector: jest.fn(() => 'en-US'),
}));

jest.mock('../../../../hooks/useFiatFormatter', () => ({
  useFiatFormatter: () => (value: number) => `$${value.toFixed(2)}`,
}));

jest.mock('../../hooks/tokens/useTokenFiatRates', () => ({
  useTokenFiatRate: () => 1.0,
}));

jest.mock('../../../../components/app/musd/merkl-client');

const MOCK_ADDRESS = '0x1234567890abcdef1234567890abcdef12345678';
const MOCK_TOKEN_ADDRESS = '0xacA92E438df0B2401fF60dA7E4337B687a2435DA';

/**
 * Encode claim calldata for testing.
 *
 * @param amount - Raw claim amount string
 * @returns Hex-encoded calldata
 */
function encodeClaimData(amount: string): string {
  const iface = new Interface(DISTRIBUTOR_CLAIM_ABI);
  return iface.encodeFunctionData('claim', [
    [MOCK_ADDRESS],
    [MOCK_TOKEN_ADDRESS],
    [amount],
    [['0x0000000000000000000000000000000000000000000000000000000000000001']],
  ]);
}

const buildMockTransaction = (
  overrides: Partial<TransactionMeta> = {},
): TransactionMeta =>
  ({
    id: 'test-tx-id',
    chainId: '0xe708',
    status: TransactionStatus.unapproved,
    type: TransactionType.musdClaim,
    txParams: {
      from: MOCK_ADDRESS,
      to: '0x3Ef3D8bA38EBe18DB133cEc108f4D14CE00Dd9Ae',
      value: '0x0',
      data: encodeClaimData('10500000'), // 10.5 MUSD
    },
    time: Date.now(),
    ...overrides,
  }) as TransactionMeta;

describe('useMerklClaimAmount', () => {
  const mockGetClaimedAmount =
    merklClient.getClaimedAmountFromContract as jest.MockedFunction<
      typeof merklClient.getClaimedAmountFromContract
    >;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetClaimedAmount.mockResolvedValue(null);
  });

  it('returns pending=true while loading', () => {
    // Never resolve
    mockGetClaimedAmount.mockReturnValue(new Promise(() => undefined));

    const { result } = renderHook(() =>
      useMerklClaimAmount(buildMockTransaction()),
    );

    expect(result.current.pending).toBe(true);
    expect(result.current.displayClaimAmount).toBeUndefined();
    expect(result.current.fiatDisplayValue).toBeUndefined();
  });

  it('computes full claim amount when nothing claimed on-chain', async () => {
    mockGetClaimedAmount.mockResolvedValue(null);

    const { result, waitForNextUpdate } = renderHook(() =>
      useMerklClaimAmount(buildMockTransaction()),
    );

    await waitForNextUpdate();

    expect(result.current.pending).toBe(false);
    // 10.5 MUSD
    expect(result.current.displayClaimAmount).toBe('10.5');
    expect(result.current.fiatDisplayValue).toBe('$10.50');
  });

  it('subtracts on-chain claimed amount', async () => {
    // 5.5 MUSD already claimed
    mockGetClaimedAmount.mockResolvedValue('5500000');

    const { result, waitForNextUpdate } = renderHook(() =>
      useMerklClaimAmount(buildMockTransaction()),
    );

    await waitForNextUpdate();

    expect(result.current.pending).toBe(false);
    // 10.5 - 5.5 = 5.0
    expect(result.current.displayClaimAmount).toBe('5');
    expect(result.current.fiatDisplayValue).toBe('$5.00');
  });

  it('returns zero when all claimed', async () => {
    mockGetClaimedAmount.mockResolvedValue('10500000');

    const { result, waitForNextUpdate } = renderHook(() =>
      useMerklClaimAmount(buildMockTransaction()),
    );

    await waitForNextUpdate();

    expect(result.current.pending).toBe(false);
    expect(result.current.displayClaimAmount).toBe('0');
  });

  it('returns undefined for non-musdClaim transactions', () => {
    const tx = buildMockTransaction({
      type: TransactionType.contractInteraction,
    });

    const { result } = renderHook(() => useMerklClaimAmount(tx));

    expect(result.current.pending).toBe(false);
    expect(result.current.displayClaimAmount).toBeUndefined();
  });

  it('handles contract call errors gracefully', async () => {
    mockGetClaimedAmount.mockRejectedValue(new Error('RPC error'));

    const { result, waitForNextUpdate } = renderHook(() =>
      useMerklClaimAmount(buildMockTransaction()),
    );

    await waitForNextUpdate();

    // Falls back to 0 claimed, so full amount is claimable
    expect(result.current.pending).toBe(false);
    expect(result.current.displayClaimAmount).toBe('10.5');
  });
});
