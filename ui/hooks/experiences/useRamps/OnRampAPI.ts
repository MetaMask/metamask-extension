import getFetchWithTimeout from '../../../../shared/modules/fetch-with-timeout';
import { AggregatorNetwork } from './useRamps.types';

const fetchWithTimeout = getFetchWithTimeout();

const PRODUCTION_URL =
  'https://on-ramp-content.metaswap.codefi.network/regions/networks?context=extension';
const DEVELOPMENT_URL =
  'https://on-ramp.dev.mmcx.codefi.network/regions/networks?context=extension';

const isNotDevelopment =
  process.env.METAMASK_ENVIRONMENT !== 'development' &&
  process.env.METAMASK_ENVIRONMENT !== 'testing' &&
  process.env.METAMASK_ENVIRONMENT !== 'test';

const url = isNotDevelopment ? PRODUCTION_URL : DEVELOPMENT_URL;

const OnRampAPI = {
  async getNetworks(): Promise<AggregatorNetwork[]> {
    const response = await fetchWithTimeout(url);
    const { networks } = await response.json();
    return networks;
  },
};

export default OnRampAPI;
