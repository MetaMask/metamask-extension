import { GMX_REFERRAL_STORAGE_ADDRESS } from '../../../../shared/constants/defi-referrals';
import { checkGmxHasReferralCode } from './referral-onchain-check';

const WALLET_ADDRESS = '0x1234567890abcdef1234567890abcdef12345678';

// Non-zero bytes32 — represents a referral code being set
const BYTES32_WITH_CODE =
  '0x424c554542455252590000000000000000000000000000000000000000000000';
// All-zero bytes32 — represents no referral code set
const BYTES32_EMPTY =
  '0x0000000000000000000000000000000000000000000000000000000000000000';

function buildProvider({
  rpcResult,
  rpcThrows = false,
}: {
  rpcResult?: string;
  rpcThrows?: boolean;
}) {
  const mockRequest = jest.fn();

  if (rpcThrows) {
    mockRequest.mockRejectedValue(new Error('RPC error'));
  } else {
    mockRequest.mockResolvedValue(rpcResult);
  }

  return {
    provider: { request: mockRequest },
    mockRequest,
  };
}

describe('checkGmxHasReferralCode', () => {
  it('returns true when the wallet has a referral code set on-chain', async () => {
    const { provider } = buildProvider({ rpcResult: BYTES32_WITH_CODE });

    const result = await checkGmxHasReferralCode(provider, WALLET_ADDRESS);

    expect(result).toBe(true);
  });

  it('returns false when the wallet has no referral code set on-chain', async () => {
    const { provider } = buildProvider({ rpcResult: BYTES32_EMPTY });

    const result = await checkGmxHasReferralCode(provider, WALLET_ADDRESS);

    expect(result).toBe(false);
  });

  it('returns false when the RPC call throws', async () => {
    const { provider } = buildProvider({ rpcThrows: true });

    const result = await checkGmxHasReferralCode(provider, WALLET_ADDRESS);

    expect(result).toBe(false);
  });

  it('queries the correct contract address', async () => {
    const { provider, mockRequest } = buildProvider({
      rpcResult: BYTES32_EMPTY,
    });

    await checkGmxHasReferralCode(provider, WALLET_ADDRESS);

    expect(mockRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'eth_call',
        params: expect.arrayContaining([
          expect.objectContaining({ to: GMX_REFERRAL_STORAGE_ADDRESS }),
        ]),
      }),
    );
  });
});
