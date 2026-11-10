import type { EnrolledCredential } from '@metamask/profile-sync-controller/sdk';
import { submitRequestToBackground } from '../../../store/background-connection';
import { createSocialLoginControllerAdapter } from './bindings';
import { createMfaFlow } from './engine/flow';
import type { MfaFlow } from './engine/types';

jest.mock('../../../store/background-connection', () => ({
  submitRequestToBackground: jest.fn(),
}));

const mockSubmitRequestToBackground = jest.mocked(submitRequestToBackground);

const credentials: EnrolledCredential[] = [
  { id: 'email_otp', type: 'email_otp', status: 'active', verified: true },
];

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

const act = async (
  flow: MfaFlow,
  action: Parameters<MfaFlow['dispatch']>[0],
) => {
  flow.dispatch(action);
  await flush();
};

/**
 * Answers like the locked AuthenticationController: it lists the credentials
 * and verifies, but opens no verification session.
 *
 * @param token - The token a completed verification returns.
 * @returns The names of the actions called, in order.
 */
const mockLockedController = (token: unknown) => {
  const calls: string[] = [];
  mockSubmitRequestToBackground.mockImplementation((async (
    _method: string,
    [action]: [string],
  ) => {
    calls.push(action.replace('AuthenticationController:', ''));
    switch (action) {
      case 'AuthenticationController:refreshSocialLoginCredentials':
        return credentials;
      case 'AuthenticationController:beginSocialLoginVerification':
        return {
          type: 'email_otp',
          flowId: `flow-${calls.length}`,
          expiresAt: Date.now() + 600_000,
        };
      case 'AuthenticationController:completeSocialLoginVerification':
        return token;
      default:
        throw new Error(`unexpected action ${action}`);
    }
  }) as never);
  return calls;
};

describe('verifying with a social login while the wallet is locked', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('finishes after the code is accepted, without starting another verification', async () => {
    const token = {
      accessToken: 'token',
      expiresIn: 900,
      obtainedAt: Date.now(),
      claims: {
        sub: 'profile',
        amr: ['email_otp'],
        exp: Math.floor(Date.now() / 1000) + 900,
      },
    };
    const calls = mockLockedController(token);
    const flow = createMfaFlow({
      request: {
        kind: 'verifyOrEnroll',
        methods: ['email_otp'],
        verifyWith: ['email_otp'],
      },
      reason: { operation: 'qa.test' },
      platform: 'extension',
      controller: createSocialLoginControllerAdapter(),
      now: () => Date.now(),
    });
    const outcome = flow.result.then(
      (value) => ({ ok: true as const, value }),
      (error) => ({ ok: false as const, error }),
    );

    await flow.start();
    await flush();
    await act(flow, { type: 'submitCode', code: '123456' });

    expect(await outcome).toStrictEqual({
      ok: true,
      value: { credentials, token },
    });
    expect(
      calls.filter((call) => call === 'beginSocialLoginVerification'),
    ).toHaveLength(1);
    expect(
      calls.filter((call) => call === 'completeSocialLoginVerification'),
    ).toHaveLength(1);
  });
});
