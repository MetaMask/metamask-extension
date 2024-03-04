export interface Identity {
  name: string;
  address: string;
  balance: string;
  keyring: {
    type: string;
  };
  label?: string;
}
