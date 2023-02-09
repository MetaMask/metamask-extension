import { NetworkClientType } from './create-network-client';
import { testsForProviderType } from './provider-api-tests/shared-tests';

describe('createNetworkClient', () => {
  testsForProviderType(NetworkClientType.INFURA);
  testsForProviderType(NetworkClientType.CUSTOM);
});
