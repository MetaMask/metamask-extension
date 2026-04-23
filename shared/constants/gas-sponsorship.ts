import type { Hex } from '@metamask/utils';

import { deriveCampaignId } from '../lib/gas-sponsorship/campaign-id';
import { CHAIN_IDS } from './network';

export const GAS_SPONSORSHIP_SUPPORTED_CHAIN_ID = CHAIN_IDS.BASE;
export const GAS_SPONSORSHIP_CAMPAIGN_NAME = 'Confirmations team';
export const GAS_SPONSORSHIP_CAMPAIGN_ID = deriveCampaignId(
  GAS_SPONSORSHIP_CAMPAIGN_NAME,
);
export const GAS_SPONSORSHIP_VAULT_ADDRESS_BASE =
  '0xffd977344c80b13683f49fa65ed2945c08f34b3c' as Hex;
export const GAS_SPONSORSHIP_BUFFER_BPS = 3500;
export const GAS_SPONSORSHIP_VAULT_ABI = [
  'function campaignDetails(bytes32 campaignId) view returns (address sponsor, uint128 availableBalanceWei)',
  'function settlementEscrow() view returns (address)',
  'function settleCampaignGas(bytes32 campaignId, uint256 amountWei)',
] as const;

export function isGasSponsorshipChainSupported(
  chainId?: string,
): chainId is Hex {
  return (
    typeof chainId === 'string' &&
    chainId.toLowerCase() === GAS_SPONSORSHIP_SUPPORTED_CHAIN_ID.toLowerCase()
  );
}
