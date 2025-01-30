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
    const { networks } = await response.json();
    return networks;
  },
};

export default RampAPI;
