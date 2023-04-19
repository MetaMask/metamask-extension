declare module '@metamask/eth-keyring-controller' {
  export class KeyringController {
    signMessage: (...any) => any;

    signPersonalMessage: (...any) => any;

    signTypedMessage: (...any) => any;

    getKeyringForAccount: (address: string) => Promise<{
      type: string;
    }>;

    getEncryptionPublicKey: (address: string) => Promise<string>;

    decryptMessage: (...any) => any;
  }
}
