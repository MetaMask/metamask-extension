import { deriveCampaignId } from './campaign-id';

describe('deriveCampaignId', () => {
  it('derives the expected campaign id from the campaign name', () => {
    expect(deriveCampaignId('Confirmations team')).toBe(
      '0x15a3519b47bfd10994040bdf9cfe7e3b069ca673e64e0a1098e5528a3eb89606',
    );
  });
});
