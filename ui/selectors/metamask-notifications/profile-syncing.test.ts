import { selectIsProfileSyncingEnabled } from './profile-syncing';

describe('Profile Syncing Selectors', () => {
  const mockState = {
    isProfileSyncingEnabled: true,
  };

  it('should select the Profile Syncinc status', () => {
    expect(selectIsProfileSyncingEnabled(mockState)).toBe(true);
  });
});
