declare module 'eth-lattice-keyring' {
  export default class LatticeKeyring {
    static type: string;

    appName: string | undefined;

    constructor(opts);

    _hasCreds(): boolean;

    _getCreds(): Promise<
      | {
          deviceID: string;
          password: string;
          endpoint?: string;
        }
      | undefined
    >;
  }
}
