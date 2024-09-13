import { NetworkStatus } from '@metamask/network-controller';
import mockState from '../../test/data/mock-state.json';
import { mockNetworkState } from '../../test/stub/networks';
import { CHAIN_IDS } from '../../shared/constants/network';
import * as networks from './networks';

describe('Network Selectors', () => {
  describe('#getNetworkConfigurations', () => {
    it('returns undefined if state.metamask.networkConfigurations is undefined', () => {
      expect(
        networks.getNetworkConfigurations({
          metamask: {
            // @ts-expect-error the types forbid `undefined`. this is a strange test.
            networkConfigurations: undefined,
          },
        }),
      ).toBeUndefined();
    });

    it('returns networkConfigurations', () => {
      const networkConfigurations = {
        testNetworkConfigurationId1: {
          rpcUrl: 'https://mock-rpc-url-1',
          chainId: '0x31337' as const,
          ticker: 'TEST',
          id: 'testNetworkConfigurationId1',
          type: 'rpc' as const,
        },
        testNetworkConfigurationId2: {
          rpcUrl: 'https://mock-rpc-url-2',
          chainId: '0x1337' as const,
          ticker: 'RPC',
          id: 'testNetworkConfigurationId2',
          type: 'rpc' as const,
        },
      };
      expect(
        networks.getNetworkConfigurations({
          metamask: {
            networkConfigurations,
          },
        }),
      ).toStrictEqual(networkConfigurations);
    });
  });

  describe('#getInfuraBlocked', () => {
    it('returns getInfuraBlocked', () => {
      let isInfuraBlocked = networks.getInfuraBlocked(
        mockState as networks.NetworkState,
      );
      expect(isInfuraBlocked).toBe(false);

      const modifiedMockState = {
        ...mockState,
        metamask: {
          ...mockState.metamask,
          ...mockNetworkState({
            chainId: CHAIN_IDS.GOERLI,
            metadata: { status: NetworkStatus.Blocked, EIPS: {} },
          }),
        },
      };
      isInfuraBlocked = networks.getInfuraBlocked(modifiedMockState);
      expect(isInfuraBlocked).toBe(true);
    });
  });
});
