import { CHAIN_IDS } from '../../../../shared/constants/network';
import { GMX_REFERRAL_STORAGE_ADDRESS } from '../../../../shared/constants/defi-referrals';
import { checkGmxHasReferralCode } from './referral-onchain-check';

const WALLET_ADDRESS = '0x1234567890abcdef1234567890abcdef12345678';
const MOCK_NETWORK_CLIENT_ID = 'arbitrum-mainnet';

// Non-zero bytes32 — represents a referral code being set
const BYTES32_WITH_CODE =
  '0x424c554542455252590000000000000000000000000000000000000000000000';
// All-zero bytes32 — represents no referral code set
const BYTES32_EMPTY =
  '0x0000000000000000000000000000000000000000000000000000000000000000';

function buildNetworkController({
  findThrows = false,
  rpcResult,
  rpcThrows = false,
}: {
  findThrows?: boolean;
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
    networkController: {
      findNetworkClientIdByChainId: findThrows
        ? jest.fn().mockImplementation(() => {
            throw new Error('Chain not found');
          })
        : jest.fn().mockReturnValue(MOCK_NETWORK_CLIENT_ID),
      getNetworkClientById: jest
        .fn()
        .mockReturnValue({ provider: { request: mockRequest } }),
    },
    mockRequest,
  };
}

describe('checkGmxHasReferralCode', () => {
  it('returns true when the wallet has a referral code set on-chain', async () => {
    const { networkController } = buildNetworkController({
      rpcResult: BYTES32_WITH_CODE,
    });

    const result = await checkGmxHasReferralCode(
      networkController,
      WALLET_ADDRESS,
    );

    expect(result).toBe(true);
  });

  it('returns false when the wallet has no referral code set on-chain', async () => {
    const { networkController } = buildNetworkController({
      rpcResult: BYTES32_EMPTY,
    });

    const result = await checkGmxHasReferralCode(
      networkController,
      WALLET_ADDRESS,
    );

    expect(result).toBe(false);
  });

  it('returns false when the RPC call throws', async () => {
    const { networkController } = buildNetworkController({ rpcThrows: true });

    const result = await checkGmxHasReferralCode(
      networkController,
      WALLET_ADDRESS,
    );

    expect(result).toBe(false);
  });

  it('returns false when Arbitrum is not configured', async () => {
    const { networkController } = buildNetworkController({ findThrows: true });

    const result = await checkGmxHasReferralCode(
      networkController,
      WALLET_ADDRESS,
    );

    expect(result).toBe(false);
  });

  it('queries the correct contract address and chain', async () => {
    const { networkController, mockRequest } = buildNetworkController({
      rpcResult: BYTES32_EMPTY,
    });

    await checkGmxHasReferralCode(networkController, WALLET_ADDRESS);

    expect(networkController.findNetworkClientIdByChainId).toHaveBeenCalledWith(
      CHAIN_IDS.ARBITRUM,
    );
    expect(networkController.getNetworkClientById).toHaveBeenCalledWith(
      MOCK_NETWORK_CLIENT_ID,
    );
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
