import { existsSync } from 'fs';
import { join } from 'path';
import { DEFI_REFERRAL_PARTNERS } from './defi-referrals';

describe('DefiReferralPartners', () => {
  it('has referral image files that exist for all partners', () => {
    Object.values(DEFI_REFERRAL_PARTNERS).forEach((partner) =>
      expect(existsSync(join('app', partner.referralImageUrl))).toBe(true),
    );
  });
});
