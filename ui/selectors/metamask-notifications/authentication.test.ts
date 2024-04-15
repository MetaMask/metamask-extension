import { getMetametricsId, selectIsSignedIn } from './authentication';

describe('Authentication Selectors', () => {
  const mockState = {
    isSignedIn: true,
    metametricsId: 'id',
  };

  it('should select the Authentications status', () => {
    expect(selectIsSignedIn(mockState)).toBe(true);
  });

  it('should select the Metamask Notifications Enabled status', () => {
    expect(getMetametricsId(mockState)).toBe('id');
  });
});
