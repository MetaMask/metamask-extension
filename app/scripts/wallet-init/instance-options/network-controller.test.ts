import {
  NetworkClientType,
  type NetworkClientConfiguration,
} from '@metamask/network-controller';
import { getNetworkControllerInstanceOptions } from './network-controller';

describe('getNetworkControllerInstanceOptions', () => {
  const originalInTest = process.env.IN_TEST;

  afterEach(() => {
    if (originalInTest === undefined) {
      delete process.env.IN_TEST;
    } else {
      process.env.IN_TEST = originalInTest;
    }
  });

  for (const inTest of [true, false]) {
    it(`customizes only custom-network polling when IN_TEST is ${inTest}`, () => {
      if (inTest) {
        process.env.IN_TEST = 'true';
      } else {
        delete process.env.IN_TEST;
      }
      const { getBlockTrackerOptions } =
        getNetworkControllerInstanceOptions('test-project-id');
      const customConfiguration: NetworkClientConfiguration = {
        type: NetworkClientType.Custom,
        chainId: '0x539',
        ticker: 'ETH',
        rpcUrl: 'http://localhost:8545',
      };
      const infuraConfiguration: NetworkClientConfiguration = {
        type: NetworkClientType.Infura,
        network: 'mainnet',
        chainId: '0x1',
        ticker: 'ETH',
        infuraProjectId: 'test-project-id',
      };

      expect(
        getBlockTrackerOptions?.(
          customConfiguration.rpcUrl,
          customConfiguration,
        ),
      ).toStrictEqual(inTest ? { pollingInterval: 1000 } : {});
      expect(
        getBlockTrackerOptions?.(
          'https://mainnet.infura.io/v3/test-project-id',
          infuraConfiguration,
        ),
      ).toStrictEqual({});
    });
  }
});
