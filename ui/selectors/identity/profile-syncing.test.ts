import { selectIsProfileSyncingEnabled } from './profile-syncing';
describe('Profile Syncing Selectors', () => {
    const mockState = {
        UserStorageController: {
            isProfileSyncingEnabled: true
        }
    };
    it('should select the Profile Syncing status', () => {
        expect(selectIsProfileSyncingEnabled(mockState)).toBe(true);
    });
});
