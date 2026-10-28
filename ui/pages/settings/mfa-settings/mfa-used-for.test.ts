import { it } from '@jest/globals';
import { IconName } from '@metamask/design-system-react';
import { getMfaUsedFor, type MfaUsedFor } from './mfa-used-for';

const keys = (rows: MfaUsedFor[]) => rows.map(({ key }) => key);

describe('getMfaUsedFor', () => {
  it.each(['passkey', 'email_otp'] as const)('lists Money for %s', (method) => {
    expect(keys(getMfaUsedFor(method, { isSocialLogin: true }))).toStrictEqual([
      'money',
    ]);
  });

  it('lists the uses that accept the method, where they apply', () => {
    const usedFor: MfaUsedFor[] = [
      {
        key: 'recovery',
        icon: IconName.Lock,
        label: 'recovery',
        methods: ['passkey'],
        isShown: ({ isSocialLogin }) => !isSocialLogin,
      },
      {
        key: 'money',
        icon: IconName.SecurityTick,
        label: 'money',
        methods: ['passkey', 'email_otp'],
      },
    ];

    expect(
      keys(getMfaUsedFor('passkey', { isSocialLogin: false }, usedFor)),
    ).toStrictEqual(['recovery', 'money']);
    expect(
      keys(getMfaUsedFor('passkey', { isSocialLogin: true }, usedFor)),
    ).toStrictEqual(['money']);
    expect(
      keys(getMfaUsedFor('email_otp', { isSocialLogin: false }, usedFor)),
    ).toStrictEqual(['money']);
  });
});
