import { normalizeMoneyReferralCode } from '#shared/lib/money-referral-code';

describe('normalizeMoneyReferralCode', () => {
  it('cleans partial text-field input', () => {
    expect(normalizeMoneyReferralCode('a-b!')).toBe('AB');
  });

  it('caps editable input at 24 characters', () => {
    expect(normalizeMoneyReferralCode('a'.repeat(25))).toBe('A'.repeat(24));
  });
});
