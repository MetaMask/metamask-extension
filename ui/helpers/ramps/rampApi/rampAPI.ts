import getFetchWithTimeout from '../../../../shared/modules/fetch-with-timeout';
import { AggregatorNetwork } from '../../../ducks/ramps/types';

const fetchWithTimeout = getFetchWithTimeout();

const isProdEnv = process.env.NODE_ENV === 'production';
const PROD_RAMP_API_BASE_URL = 'https://on-ramp-content.api.cx.metamask.io';
const UAT_RAMP_API_BASE_URL = 'https://on-ramp-content.uat-api.cx.metamask.io';

const rampApiBaseUrl =
  process.env.METAMASK_RAMP_API_CONTENT_BASE_URL ||
  (isProdEnv ? PROD_RAMP_API_BASE_URL : UAT_RAMP_API_BASE_URL);

const RampAPI = {
  async getNetworks(): Promise<AggregatorNetwork[]> {
    const url = new URL('/regions/networks', rampApiBaseUrl);
    url.searchParams.set('context', 'extension');
    const response = await fetchWithTimeout(url.toString());

    let { networks } = await response.json();

    networks = [
      ...networks,
      {
        active: true,
        chainId: 'bip122:000000000019d6689c085ae165831e93',
        chainName: 'Bitcoin',
        shortName: 'Bitcoin',
        nativeTokenSupported: true,
        isEvm: false,
      },
    ];

    return networks;
  },
};

export default RampAPI;
