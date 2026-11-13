import { submitRequestToBackground } from '../../../store/background-connection';
import { removeMfaCredential } from './removeMfaCredential';

jest.mock('../../../store/background-connection', () => ({
  submitRequestToBackground: jest.fn(),
}));

describe('removeMfaCredential', () => {
  it('removes the method by its id', async () => {
    jest.mocked(submitRequestToBackground).mockResolvedValue([]);

    await removeMfaCredential(
      { id: 'totp', type: 'totp', status: 'active' },
      { operation: 'settings.removeAuthenticatorApp' },
    );

    expect(submitRequestToBackground).toHaveBeenCalledWith('messengerCall', [
      'AuthenticationController:removeCredential',
      [
        {
          credentialId: 'totp',
          reason: { operation: 'settings.removeAuthenticatorApp' },
        },
      ],
    ]);
  });
});
