import nock from 'nock';
import {
  TX_INSIGHTS_BASE_URI,
  TX_INSIGHTS_NETWORKS_ENDPOINT,
} from './constants';
import { fetchSupportedNetworks } from './transaction-decoding.util';

const SUPPORTED_NETWROKS = [
  {
    active: true,
    chainId: 1,
    chainName: 'Ethereum Mainnet',
  },
  {
    active: true,
    chainId: 42,
    chainName: 'Ethereum Testnet Kovan',
  },
];

describe('fetchSupportedNetworks', () => {
  beforeAll(() => {
    nock(TX_INSIGHTS_BASE_URI)
      .persist()
      .get(TX_INSIGHTS_NETWORKS_ENDPOINT)
      .reply(200, SUPPORTED_NETWROKS);
  });

  it('should fetch the list of supported networks if mainnet is supported', async () => {
    const result = await fetchSupportedNetworks(1, '');
    expect(result).toStrictEqual(SUPPORTED_NETWROKS);
  });

  it('should fetch the list of supported networks if kovan is supported', async () => {
    const result = await fetchSupportedNetworks(42, '');
    expect(result).toStrictEqual(SUPPORTED_NETWROKS);
  });

  it('should throw an error if network is not supported', async () => {
    const errorMessage = 'NETWORK_NOT_SUPPORTED';
    await expect(fetchSupportedNetworks(250, errorMessage)).rejects.toThrow(
      errorMessage,
    );
  });
});
