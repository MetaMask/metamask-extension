import { CHAIN_IDS } from '../../../../shared/constants/network';
import { GMX_REFERRAL_STORAGE_ADDRESS } from '../../../../shared/constants/defi-referrals';
import { toFunctionSelector } from '../../../../shared/lib/delegation/utils';

/** Minimal shape of NetworkController required for the on-chain referral check. */
type NetworkControllerLike = {
  findNetworkClientIdByChainId: (chainId: string) => string;
  getNetworkClientById: (networkClientId: string) => {
    provider: {
      request: (args: { method: string; params: unknown[] }) => Promise<string>;
    };
  };
};

/**
 * Checks if an address has a referral code set on GMX's Arbitrum ReferralStorage contract.
 *
 * @param networkController - NetworkController instance used to obtain the Arbitrum provider.
 * @param walletAddress - The wallet address to check (hex string).
 * @returns Whether the wallet has a GMX referral code on-chain.
 */
export async function checkGmxHasReferralCode(
  networkController: NetworkControllerLike,
  walletAddress: string,
): Promise<boolean> {
  try {
    const networkClientId = networkController.findNetworkClientIdByChainId(
      CHAIN_IDS.ARBITRUM,
    );
    const { provider } =
      networkController.getNetworkClientById(networkClientId);

    // Encode traderReferralCodes(address): selector + address zero-padded to 32 bytes
    const selector = toFunctionSelector('traderReferralCodes(address)');
    const paddedAddress = walletAddress
      .toLowerCase()
      .replace('0x', '')
      .padStart(64, '0');
    const callData = `${selector}${paddedAddress}`;

    const result = await provider.request({
      method: 'eth_call',
      params: [{ to: GMX_REFERRAL_STORAGE_ADDRESS, data: callData }, 'latest'],
    });

    // Result is a bytes32; all-zero means no code is set
    return typeof result === 'string' && BigInt(result) !== 0n;
  } catch {
    // If Arbitrum is not configured or the RPC call fails, default to false
    return false;
  }
}
