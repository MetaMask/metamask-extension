import { submitRequestToBackground } from '../../../store/background-connection';
import { extensionMfaControllerAdapter } from './bindings';

jest.mock('../../../store/background-connection', () => ({
  submitRequestToBackground: jest.fn(),
}));

const mockSubmitRequestToBackground = jest.mocked(submitRequestToBackground);

describe('extensionMfaControllerAdapter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls the AuthenticationController through the background', async () => {
    const request = {
      type: 'email_otp' as const,
      email: 'a@b.co',
      reason: { operation: 'test' },
    };
    const response = { type: 'email_otp', flowId: 'flow-1', expiresAt: 1 };
    mockSubmitRequestToBackground.mockResolvedValue(response);

    expect(
      await extensionMfaControllerAdapter.beginCredentialEnrollment(request),
    ).toBe(response);
    expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
      'messengerCall',
      ['AuthenticationController:beginCredentialEnrollment', [request]],
    );
  });

  it('forwards getVerificationToken with its request', async () => {
    mockSubmitRequestToBackground.mockResolvedValue(null);

    expect(
      await extensionMfaControllerAdapter.getVerificationToken({
        maxSessionAgeMs: 1000,
      }),
    ).toBeNull();
    expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
      'messengerCall',
      [
        'AuthenticationController:getVerificationToken',
        [{ maxSessionAgeMs: 1000 }],
      ],
    );
  });

  it('forwards clearVerificationSession without arguments', async () => {
    mockSubmitRequestToBackground.mockResolvedValue(undefined);

    await extensionMfaControllerAdapter.clearVerificationSession();

    expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
      'messengerCall',
      ['AuthenticationController:clearVerificationSession', []],
    );
  });
});
