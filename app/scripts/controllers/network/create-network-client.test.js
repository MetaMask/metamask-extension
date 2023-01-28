import { testsForProviderType } from './provider-api-tests/shared-tests';

describe('createNetworkClient', () => {
  testsForProviderType('infura');

  testsForProviderType('custom');
});
