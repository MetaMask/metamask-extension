declare module '@metamask/eth-keyring-controller' {
  export class KeyringController {
    signMessage: (...any) => any;

    signPersonalMessage: (...any) => any;

    signTypedMessage: (...any) => any;

    getKeyringForAccount: (...any) => any;

    getEncryptionPublicKey: (...any) => any;
  }
}
