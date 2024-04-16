import nock from 'nock';
import { defaultBuyableChains } from '../../ducks/ramps/constants';
import rampAPI from './rampAPI';

const mockedResponse = {
  networks: defaultBuyableChains,
};

describe('rampAPI', () => {
  afterEach(() => {
    nock.cleanAll();
  });

  it('should fetch networks', async () => {
    nock('https://on-ramp.dev.mmcx.codefi.network')
      .get('/regions/networks')
      .query(true)
      .reply(200, mockedResponse);
    const result = await rampAPI.getNetworks();
    expect(result).toEqual(mockedResponse.networks);
  });
});
