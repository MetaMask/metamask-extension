export type PreferencesControllerErrorState = {
  initializationFlags: {
    corruptionDetected: boolean;
    vaultBackedUp: boolean;
  };
};

export const getPreferencesControllerErrorState = (
  keyringVault: object | null,
): PreferencesControllerErrorState => ({
  initializationFlags: {
    corruptionDetected: true,
    vaultBackedUp: keyringVault !== null,
  },
});
