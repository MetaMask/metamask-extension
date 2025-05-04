declare module 'eth-chainlist' {
  export type Chain = {
    chainId: number;
    name: string;
    nativeCurrency: { symbol: string };
    rpc: string[];
  };
  export function rawChainData(): Chain[];
}
