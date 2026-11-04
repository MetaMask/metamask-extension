import { EXCLUDED_CAPABILITIES } from './rewards-money-controller';

describe('Rewards Money UI exclusions', () => {
  it('keeps security-policy inputs in background capture only', () => {
    expect(EXCLUDED_CAPABILITIES.actions).toContain(
      'RewardsMoneyController:captureReferralContext',
    );
  });
});
