import { deriveCampaignId } from '../lib/gas-sponsorship/campaign-id';
import { CHAIN_IDS } from './network';
import {
  GAS_SPONSORSHIP_CAMPAIGN_ID,
  GAS_SPONSORSHIP_CAMPAIGN_NAME,
  GAS_SPONSORSHIP_VAULT_ABI,
  GAS_SPONSORSHIP_VAULT_ADDRESS_BASE,
  isGasSponsorshipChainSupported,
} from './gas-sponsorship';

describe('gas sponsorship constants', () => {
  it('derives the campaign id from the campaign name', () => {
    expect(GAS_SPONSORSHIP_CAMPAIGN_ID).toBe(
      deriveCampaignId(GAS_SPONSORSHIP_CAMPAIGN_NAME),
    );
  });

  it('supports only Base chain', () => {
    expect(isGasSponsorshipChainSupported(CHAIN_IDS.BASE)).toBe(true);
    expect(isGasSponsorshipChainSupported(CHAIN_IDS.MAINNET)).toBe(false);
  });

  it('uses the Base SponsorshipVaultV3 deployment', () => {
    expect(GAS_SPONSORSHIP_VAULT_ADDRESS_BASE).toBe(
      '0xdE45e8536770A7fd5E6aCA0b98f4b04Ec45ACe80',
    );
  });

  it('exports SponsorshipVault ABI signatures', () => {
    expect(GAS_SPONSORSHIP_VAULT_ABI).toStrictEqual(
      expect.arrayContaining([
        'function campaignDetails(bytes32 campaignId) view returns (address sponsor, uint128 availableBalanceWei)',
        'function settlementEscrow() view returns (address)',
        'function settleCampaignGas(bytes32 campaignId, uint256 amountWei)',
      ]),
    );
  });
});
