import { generateWalletPassword } from './generate-wallet-password';

describe('generateWalletPassword', () => {
  it('returns a high-entropy base64url string', () => {
    const password = generateWalletPassword();
    expect(password.length).toBeGreaterThanOrEqual(32);
    expect(password).toMatch(/^[A-Za-z0-9_-]+$/u);
  });

  it('returns distinct values', () => {
    expect(generateWalletPassword()).not.toBe(generateWalletPassword());
  });
});
