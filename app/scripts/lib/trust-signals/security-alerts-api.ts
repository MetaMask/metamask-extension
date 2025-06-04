import { SECOND } from '../../../../shared/constants/time';
import getFetchWithTimeout from '../../../../shared/modules/fetch-with-timeout';
import {
  ScanAddressRequest,
  ScanAddressResponse,
  SupportedEVMChain,
} from './types';

const TIMEOUT = 5 * SECOND;

export async function scanAddress(
  chain: SupportedEVMChain,
  address: string,
): Promise<ScanAddressResponse> {
  const endpoint = `${process.env.SECURITY_ALERTS_API_URL}/address/evm/scan`;
  const body: ScanAddressRequest = {
    chain,
    address,
  };

  const response = await getFetchWithTimeout(TIMEOUT)(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  return data;
}
