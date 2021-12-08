import nock from 'nock';
import {
  TX_INSIGHTS_BASE_URI,
  TX_INSIGHTS_NETWORKS_ENDPOINT,
  TX_INSIGHTS_PROJECT_INFO_ENDPOINT,
} from './constants';
import {
  SUPPORTED_NETWROKS,
  CONTRACT_ADDRESS,
  FETCH_PROJECT_INFO_RESULTS,
} from './transaction-decoding.util-test-constants';
import {
  fetchSupportedNetworks,
  fetchProjectInfo,
} from './transaction-decoding.util';

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

describe('fetchProjectInfo', () => {
  afterEach(() => {
    nock.restore();
    nock.cleanAll();
  });

  it('should fetch project info for a valid contract address', async () => {
    nock(TX_INSIGHTS_BASE_URI)
      .get(
        `${TX_INSIGHTS_PROJECT_INFO_ENDPOINT}?to=${CONTRACT_ADDRESS}&network-id=1`,
      )
      .reply(200, FETCH_PROJECT_INFO_RESULTS);
    const result = await fetchProjectInfo(CONTRACT_ADDRESS, 1);
    expect(result).toStrictEqual(FETCH_PROJECT_INFO_RESULTS);
  });

  it('should throw an error if project info is not available', async () => {
    nock(TX_INSIGHTS_BASE_URI)
      .get(
        `${TX_INSIGHTS_PROJECT_INFO_ENDPOINT}?to=${CONTRACT_ADDRESS}&network-id=250`,
      )
      .reply(400, { error: 'error' });
    await expect(fetchProjectInfo(CONTRACT_ADDRESS, 250)).rejects.toThrow('');
  });
});
