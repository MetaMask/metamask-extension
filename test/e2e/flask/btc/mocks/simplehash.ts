import { Mockttp } from 'mockttp';
import { DEFAULT_BTC_ADDRESS } from '../../../constants';

const SIMPLEHASH_URL = 'https://api.simplehash.com/api';

export const mockInscriptions = (mockServer: Mockttp) =>
  mockServer
    .forGet(`${SIMPLEHASH_URL}/v0/nfts/owners_v2`)
    .withQuery({
      chains: 'bitcoin',
      wallet_addresses: DEFAULT_BTC_ADDRESS,
      limit: 50,
    })
    .thenJson(200, { next_cursor: null, next: null, previous: null, nfts: [] });
