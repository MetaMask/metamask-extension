import { selectIsSignedIn, selectSessionData } from './authentication';

describe('Authentication Selectors', () => {
  const mockState = {
    metamask: {
      isSignedIn: true,
      sessionData: {
        profile: {
          identifierId: 'identifierId',
          profileId: 'profileId',
        },
        accessToken: 'accessToken',
        expiresIn: 'expiresIn',
      },
    },
  };

  it('should select the authentication status', () => {
    expect(selectIsSignedIn(mockState)).toBe(mockState.metamask.isSignedIn);
  });

  it('should select the session data', () => {
    expect(selectSessionData(mockState)).toEqual(
      mockState.metamask.sessionData,
    );
  });
});
