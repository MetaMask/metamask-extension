import { SECOND } from '../../../../shared/constants/time';
import getFetchWithTimeout from '../../../../shared/modules/fetch-with-timeout';
import {
  ResultType,
  ScanAddressRequest,
  ScanAddressResponse,
  SupportedEVMChain,
} from './types';

const TIMEOUT = 5 * SECOND;
const ENDPOINT_ADDRESS_SCAN = 'address/evm/scan';

export async function scanAddress(
  chain: SupportedEVMChain,
  address: string,
): Promise<ScanAddressResponse> {
  const baseUrl = process.env.SECURITY_ALERTS_API_URL;
  if (!baseUrl) {
    throw new Error('SECURITY_ALERTS_API_URL is not set');
  }
  const endpoint = `${baseUrl}/${ENDPOINT_ADDRESS_SCAN}`;
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
  data.label = 'Uniswap';
  data.result_type = ResultType.Trusted;
  console.log('data', data);
  return data;
}
