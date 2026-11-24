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
  /**
   * Opaque attribution codes returned by the Security Alerts API, forwarded
   * to analytics as-is.
   */
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  address_alert_response_flagged_by?: number[];
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
