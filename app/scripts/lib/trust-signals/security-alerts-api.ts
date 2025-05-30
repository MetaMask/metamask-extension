import {
  ScanAddressRequest,
  ScanAddressResponse,
  SupportedEVMChain,
} from './types';

export async function scanAddress(
  chain: SupportedEVMChain,
  address: string,
): Promise<ScanAddressResponse> {
  const endpoint = `${process.env.SECURITY_ALERTS_API_URL}/address/evm/scan`;
  const body = {
    chain,
    address,
  } as ScanAddressRequest;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  return data;
}
