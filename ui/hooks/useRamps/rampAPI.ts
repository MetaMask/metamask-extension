import getFetchWithTimeout from '../../../shared/modules/fetch-with-timeout';
import { AggregatorNetwork } from './useRamps.types';

const fetchWithTimeout = getFetchWithTimeout();

const rampApiBaseUrl =
  process.env.METAMASK_RAMP_API_URL ||
  'https://on-ramp-content.metaswap.codefi.network';

const OnRampAPI = {
  async getNetworks(): Promise<AggregatorNetwork[]> {
    const url = `${rampApiBaseUrl}/regions/networks?context=extension`;
    const response = await fetchWithTimeout(url);
    const { networks } = await response.json();
    return networks;
  },
};

export default OnRampAPI;
