import { AuthConnection } from "@metamask/seedless-onboarding-controller";
import { BackupState, getIsSocialLoginFlowInitialized, getSocialLoginEmail, getSocialLoginType } from "./social-sync";

const MOCK_NODE_AUTH_TOKENS = [
  {
    authToken: 'authToken',
    nodeIndex: 1,
    nodePubKey: 'nodePubKey',
  },
  {
    authToken: 'authToken2',
    nodeIndex: 2,
    nodePubKey: 'nodePubKey2',
  },
  {
    authToken: 'authToken3',
    nodeIndex: 3,
    nodePubKey: 'nodePubKey3',
  },
];

const MOCK_STATE: BackupState = {
  metamask: {
    userId: 'mock-user-id',
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    nodeAuthTokens: MOCK_NODE_AUTH_TOKENS,
    socialBackupsMetadata: [],
    socialLoginEmail: 'mock-social-login-email',
    authConnection: AuthConnection.Google,
  },
};

describe('social-sync selectors', () => {
  describe('#getSocialLoginType', () => {
    it('returns the social login type', () => {
      expect(getSocialLoginType(MOCK_STATE)).toBe(AuthConnection.Google);
    });
  });

  describe('#getSocialLoginEmail', () => {
    it('returns the social login email', () => {
      expect(getSocialLoginEmail(MOCK_STATE)).toBe('mock-social-login-email');
    });

    it('returns undefined if the social login email is not set', () => {
      const state = { ...MOCK_STATE, metamask: { ...MOCK_STATE.metamask, socialLoginEmail: undefined } };
      expect(getSocialLoginEmail(state)).toBeUndefined();
    });
  });

  describe('#getIsSocialLoginFlowInitialized', () => {
    it('returns true if the social login flow has been initialized and the user is authenticated', () => {
      expect(getIsSocialLoginFlowInitialized(MOCK_STATE)).toBe(true);
    });

    it('returns false if the social login flow has not been initialized', () => {
      const state = { ...MOCK_STATE, metamask: { ...MOCK_STATE.metamask, socialLoginEmail: undefined } };
      expect(getIsSocialLoginFlowInitialized(state)).toBe(false);
    });

    it('returns false if the user is not authenticated', () => {
      const state = { ...MOCK_STATE, metamask: { ...MOCK_STATE.metamask, userId: undefined } };
      expect(getIsSocialLoginFlowInitialized(state)).toBe(false);
    });

    it('returns false if the `accessToken` is not set in the state', () => {
      const state = { ...MOCK_STATE, metamask: { ...MOCK_STATE.metamask, accessToken: undefined } };
      expect(getIsSocialLoginFlowInitialized(state)).toBe(false);
    });
  });
});
