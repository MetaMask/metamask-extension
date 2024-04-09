import getFetchWithTimeout from '../../../shared/modules/fetch-with-timeout';
import { AggregatorNetwork } from '../../ducks/ramps/types';
import { defaultBuyableChains } from '../../ducks/ramps/constants';

const fetchWithTimeout = getFetchWithTimeout();

const rampApiBaseUrl =
  process.env.METAMASK_RAMP_API_BASE_URL ||
  'https://on-ramp-content.metaswap.codefi.network';

const RampAPI = {
  async getNetworks(): Promise<AggregatorNetwork[]> {
    try {
      const url = `${rampApiBaseUrl}/regions/networks?context=extension`;
      const response = await fetchWithTimeout(url);
      const { networks } = await response.json();
      return networks;
    } catch (error) {
      return defaultBuyableChains;
    }
  },
};

export default RampAPI;
