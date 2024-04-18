import getFetchWithTimeout from '../../../../shared/modules/fetch-with-timeout';
import { AggregatorNetwork } from '../../../ducks/ramps/types';

const fetchWithTimeout = getFetchWithTimeout();

const rampApiBaseUrl =
  process.env.METAMASK_RAMP_API_CONTENT_BASE_URL ||
  'https://on-ramp-content.api.cx.metamask.io';

const RampAPI = {
  async getNetworks(): Promise<AggregatorNetwork[]> {
    const url = new URL('/regions/networks', rampApiBaseUrl);
    url.searchParams.append('context', 'extension');
    const response = await fetchWithTimeout(url.toString());

    const { networks } = await response.json();
    return networks;
  },
};

export default RampAPI;
