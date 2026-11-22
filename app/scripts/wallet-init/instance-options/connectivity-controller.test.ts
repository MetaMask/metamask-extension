import type { ConnectivityAdapter } from '@metamask/connectivity-controller';
import { getConnectivityControllerInstanceOptions } from './connectivity-controller';

describe('getConnectivityControllerInstanceOptions', () => {
  it('passes the connectivity adapter through', () => {
    const connectivityAdapter = {
      name: 'mock-adapter',
    } as unknown as ConnectivityAdapter;

    expect(
      getConnectivityControllerInstanceOptions({ connectivityAdapter }),
    ).toStrictEqual({ connectivityAdapter });
  });
});
