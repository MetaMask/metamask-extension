declare module 'eth-chainlist' {
  export type WellknownChain = {
    chainId: number;
    name: string;
    nativeCurrency?: { symbol?: string };
    rpc: string[];
  };
  export function rawChainData(): WellknownChain[];
}
