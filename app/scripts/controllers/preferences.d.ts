export type AccountIdentityEntry = {
  address: string;
  name: string;
};

export type PreferencesControllerState = {
  identities: { [address: string]: AccountIdentityEntry };
  securityAlertsEnabled: boolean;
};

export type PreferencesController = {
  setSelectedAddress(addressToLowerCase: string): void;
  getSelectedAddress(): string;
  setAccountLabel(address: string, label: string): void;
  setAddresses(allAccounts: string[]): void;
  store: {
    getState: () => PreferencesControllerState;
    subscribe: (callback: (state: PreferencesControllerState) => void) => void;
  };
};
