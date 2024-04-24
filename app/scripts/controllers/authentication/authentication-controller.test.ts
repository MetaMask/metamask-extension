import { ControllerMessenger } from '@metamask/base-controller';
import AuthenticationController, {
  AllowedActions,
  AuthenticationControllerState,
} from './authentication-controller';
import {
  MOCK_ACCESS_TOKEN,
  MOCK_LOGIN_RESPONSE,
  mockEndpointAccessToken,
  mockEndpointGetNonce,
  mockEndpointLogin,
} from './mocks/mockServices';

const mockSignedInState = (): AuthenticationControllerState => ({
  isSignedIn: true,
  sessionData: {
    accessToken: 'MOCK_ACCESS_TOKEN',
    expiresIn: new Date().toString(),
    profile: {
      identifierId: MOCK_LOGIN_RESPONSE.profile.identifier_id,
      profileId: MOCK_LOGIN_RESPONSE.profile.profile_id,
      metametricsId: MOCK_LOGIN_RESPONSE.profile.metametrics_id,
    },
  },
});

describe('authentication/authentication-controller - constructor() tests', () => {
  test('should initialize with default state', () => {
    const controller = new AuthenticationController({
      messenger: createAuthenticationMessenger(),
    });

    expect(controller.state.isSignedIn).toBe(false);
    expect(controller.state.sessionData).toBeUndefined();
  });

  test('should initialize with override state', () => {
    const controller = new AuthenticationController({
      messenger: createAuthenticationMessenger(),
      state: mockSignedInState(),
    });

    expect(controller.state.isSignedIn).toBe(true);
    expect(controller.state.sessionData).toBeDefined();
  });
});

describe('authentication/authentication-controller - performSignIn() tests', () => {
  test('Should create access token and update state', async () => {
    const mockEndpoints = mockAuthenticationFlowEndpoints();
    const { messenger, mockSnapGetPublicKey, mockSnapSignMessage } =
      createMockAuthenticationMessenger();

    const controller = new AuthenticationController({ messenger });

    const result = await controller.performSignIn();
    expect(mockSnapGetPublicKey).toBeCalled();
    expect(mockSnapSignMessage).toBeCalled();
    mockEndpoints.mockGetNonceEndpoint.done();
    mockEndpoints.mockLoginEndpoint.done();
    mockEndpoints.mockAccessTokenEndpoint.done();
    expect(result).toBe(MOCK_ACCESS_TOKEN);

    // Assert - state shows user is logged in
    expect(controller.state.isSignedIn).toBe(true);
    expect(controller.state.sessionData).toBeDefined();
  });

  test('Should error when nonce endpoint fails', async () => {
    await testAndAssertFailingEndpoints('nonce');
  });

  test('Should error when login endpoint fails', async () => {
    await testAndAssertFailingEndpoints('login');
  });

  test('Should error when tokens endpoint fails', async () => {
    await testAndAssertFailingEndpoints('token');
  });

  async function testAndAssertFailingEndpoints(
    endpointFail: 'nonce' | 'login' | 'token',
  ) {
    const mockEndpoints = mockAuthenticationFlowEndpoints({
      endpointFail,
    });
    const { messenger } = createMockAuthenticationMessenger();
    const controller = new AuthenticationController({ messenger });

    await expect(controller.performSignIn()).rejects.toThrow();
    expect(controller.state.isSignedIn).toBe(false);

    const endpointsCalled = [
      mockEndpoints.mockGetNonceEndpoint.isDone(),
      mockEndpoints.mockLoginEndpoint.isDone(),
      mockEndpoints.mockAccessTokenEndpoint.isDone(),
    ];
    if (endpointFail === 'nonce') {
      expect(endpointsCalled).toEqual([true, false, false]);
    }

    if (endpointFail === 'login') {
      expect(endpointsCalled).toEqual([true, true, false]);
    }

    if (endpointFail === 'token') {
      expect(endpointsCalled).toEqual([true, true, true]);
    }
  }
});

describe('authentication/authentication-controller - performSignOut() tests', () => {
  test('Should remove signed in user and any access tokens', () => {
    const { messenger } = createMockAuthenticationMessenger();
    const controller = new AuthenticationController({
      messenger,
      state: mockSignedInState(),
    });

    controller.performSignOut();
    expect(controller.state.isSignedIn).toBe(false);
    expect(controller.state.sessionData).toBeUndefined();
  });

  test('Should throw error if attempting to sign out when user is not logged in', () => {
    const { messenger } = createMockAuthenticationMessenger();
    const controller = new AuthenticationController({
      messenger,
      state: { isSignedIn: false },
    });

    expect(() => controller.performSignOut()).toThrow();
  });
});

describe('authentication/authentication-controller - getBearerToken() tests', () => {
  test('Should throw error if not logged in', async () => {
    const { messenger } = createMockAuthenticationMessenger();
    const controller = new AuthenticationController({
      messenger,
      state: { isSignedIn: false },
    });

    await expect(controller.getBearerToken()).rejects.toThrow();
  });

  test('Should return original access token in state', async () => {
    const { messenger } = createMockAuthenticationMessenger();
    const originalState = mockSignedInState();
    const controller = new AuthenticationController({
      messenger,
      state: originalState,
    });

    const result = await controller.getBearerToken();
    expect(result).toBeDefined();
    expect(result).toBe(originalState.sessionData?.accessToken);
  });

  test('Should return new access token if state is invalid', async () => {
    const { messenger } = createMockAuthenticationMessenger();
    mockAuthenticationFlowEndpoints();
    const originalState = mockSignedInState();
    if (originalState.sessionData) {
      originalState.sessionData.accessToken = 'ACCESS_TOKEN_1';

      const d = new Date();
      d.setMinutes(d.getMinutes() - 31); // expires at 30 mins
      originalState.sessionData.expiresIn = d.toString();
    }

    const controller = new AuthenticationController({
      messenger,
      state: originalState,
    });

    const result = await controller.getBearerToken();
    expect(result).toBeDefined();
    expect(result).toBe(MOCK_ACCESS_TOKEN);
  });
});

describe('authentication/authentication-controller - getSessionProfile() tests', () => {
  test('Should throw error if not logged in', async () => {
    const { messenger } = createMockAuthenticationMessenger();
    const controller = new AuthenticationController({
      messenger,
      state: { isSignedIn: false },
    });

    await expect(controller.getSessionProfile()).rejects.toThrow();
  });

  test('Should return original access token in state', async () => {
    const { messenger } = createMockAuthenticationMessenger();
    const originalState = mockSignedInState();
    const controller = new AuthenticationController({
      messenger,
      state: originalState,
    });

    const result = await controller.getSessionProfile();
    expect(result).toBeDefined();
    expect(result).toEqual(originalState.sessionData?.profile);
  });

  test('Should return new access token if state is invalid', async () => {
    const { messenger } = createMockAuthenticationMessenger();
    mockAuthenticationFlowEndpoints();
    const originalState = mockSignedInState();
    if (originalState.sessionData) {
      originalState.sessionData.profile.identifierId = 'ID_1';

      const d = new Date();
      d.setMinutes(d.getMinutes() - 31); // expires at 30 mins
      originalState.sessionData.expiresIn = d.toString();
    }

    const controller = new AuthenticationController({
      messenger,
      state: originalState,
    });

    const result = await controller.getSessionProfile();
    expect(result).toBeDefined();
    expect(result.identifierId).toBe(MOCK_LOGIN_RESPONSE.profile.identifier_id);
    expect(result.profileId).toBe(MOCK_LOGIN_RESPONSE.profile.profile_id);
    expect(result.metametricsId).toBe(
      MOCK_LOGIN_RESPONSE.profile.metametrics_id,
    );
  });
});

function createAuthenticationMessenger() {
  const messenger = new ControllerMessenger<AllowedActions, never>();
  return messenger.getRestricted({
    name: 'AuthenticationController',
    allowedActions: [`SnapController:handleRequest`],
  });
}

function createMockAuthenticationMessenger() {
  const messenger = createAuthenticationMessenger();
  const mockCall = jest.spyOn(messenger, 'call');
  const mockSnapGetPublicKey = jest.fn().mockResolvedValue('MOCK_PUBLIC_KEY');
  const mockSnapSignMessage = jest
    .fn()
    .mockResolvedValue('MOCK_SIGNED_MESSAGE');

  mockCall.mockImplementation((...args) => {
    const [actionType, params] = args;
    if (actionType === 'SnapController:handleRequest') {
      if (params?.request.method === 'getPublicKey') {
        return mockSnapGetPublicKey();
      }

      if (params?.request.method === 'signMessage') {
        return mockSnapSignMessage();
      }

      throw new Error(
        `MOCK_FAIL - unsupported SnapController:handleRequest call: ${params?.request.method}`,
      );
    }

    function exhaustedMessengerMocks(action: never) {
      throw new Error(`MOCK_FAIL - unsupported messenger call: ${action}`);
    }

    return exhaustedMessengerMocks(actionType);
  });

  return { messenger, mockSnapGetPublicKey, mockSnapSignMessage };
}

function mockAuthenticationFlowEndpoints(params?: {
  endpointFail: 'nonce' | 'login' | 'token';
}) {
  const mockGetNonceEndpoint = mockEndpointGetNonce(
    params?.endpointFail === 'nonce' ? { status: 500 } : undefined,
  );
  const mockLoginEndpoint = mockEndpointLogin(
    params?.endpointFail === 'login' ? { status: 500 } : undefined,
  );
  const mockAccessTokenEndpoint = mockEndpointAccessToken(
    params?.endpointFail === 'token' ? { status: 500 } : undefined,
  );

  return {
    mockGetNonceEndpoint,
    mockLoginEndpoint,
    mockAccessTokenEndpoint,
  };
}
