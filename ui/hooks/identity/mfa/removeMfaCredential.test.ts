import { removeMfaCredential } from './removeMfaCredential';

describe('removeMfaCredential', () => {
  it('rejects until the server supports removal', async () => {
    await expect(
      removeMfaCredential({ type: 'passkey', status: 'active' }),
    ).rejects.toThrow('Removing MFA methods is not supported yet');
  });
});
