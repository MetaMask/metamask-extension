import type { Hex } from '@metamask/utils';

export function createCacheKey(chainId: Hex, address: string) {
  return `${chainId.toLowerCase()}:${address.toLowerCase()}`;
}

export enum ResultType {
  Malicious = 'Malicious',
  Warning = 'Warning',
  Benign = 'Benign',
  Trusted = 'Trusted',
  ErrorResult = 'Error',
  Loading = 'Loading',
}

export type ScanAddressResponse = {
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  result_type: ResultType;
  label: string;
};

export type CachedScanAddressResponse = ScanAddressResponse & {
  timestamp: number;
};

export type GetAddressSecurityAlertResponse = (
  cacheKey: string,
) => ScanAddressResponse | undefined;

export type AddAddressSecurityAlertResponse = (
  cacheKey: string,
  response: ScanAddressResponse,
) => void;
