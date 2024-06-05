declare module 'eth-lattice-keyring' {
  export default class LatticeKeyring {
    static type: string;

    appName: string | undefined;

    constructor(opts);

    _getCreds(): Promise<{
      deviceID: string;
      password: string;
      endpoint: string;
    }>;
  }
}
