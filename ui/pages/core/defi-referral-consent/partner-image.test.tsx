import { existsSync } from 'fs';
import { join } from 'path';
import { DEFI_REFERRAL_PARTNERS } from '../../../../shared/constants/defi-referrals';

describe('PartnerImage', () => {
  it('has image files that exist for all referral partners', () => {
    Object.values(DEFI_REFERRAL_PARTNERS).forEach((partner) =>
      expect(existsSync(join('app/images', `${partner.id}-referral.png`))).toBe(
        true,
      ),
    );
  });
});
