import type { Address } from 'abitype';

type FunctionParameters = {
  address: Address;
  chainId: number;
};

export type NonceManager = {
  /** Get and increment a nonce. */
  consume: (
    parameters: FunctionParameters & { client: any },
  ) => Promise<number>;
  /** Increment a nonce. */
  increment: (chainId: FunctionParameters) => void;
  /** Get a nonce. */
  get: (chainId: FunctionParameters & { client: any }) => Promise<number>;
  /** Reset a nonce. */
  reset: (chainId: FunctionParameters) => void;
};
