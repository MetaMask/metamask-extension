import { CHAIN_IDS } from '../../../../shared/constants/network';
import { mockNetworkState } from '../../../../test/stub/networks';

/* eslint-disable import/unambiguous */
let mapStateToProps;

jest.mock('react-redux', () => ({
  connect: (ms) => {
    mapStateToProps = ms;
    return () => ({});
  },
}));

require('./transaction-activity-log.container');

describe('TransactionActivityLog container', () => {
  describe('mapStateToProps()', () => {
    it('should return the correct props', () => {
      const mockState = {
        metamask: {
          currencyRates: {
            ETH: {
              conversionRate: 280.45,
            },
          },

          ...mockNetworkState({ chainId: CHAIN_IDS.MAINNET }),
        },
      };

      expect(mapStateToProps(mockState)).toStrictEqual({
        conversionRate: 280.45,
        nativeCurrency: 'ETH',
        rpcPrefs: {
          blockExplorerUrl: 'https://localhost/blockExplorer/0x1',
        },
      });
    });

    it('should return the correct props when on a custom network', () => {
      const mockState = {
        metamask: {
          currencyRates: {
            ETH: {
              conversionRate: 280.45,
            },
          },
          ...mockNetworkState({
            chainId: CHAIN_IDS.MAINNET,
            rpcUrl: 'https://customnetwork.com/',
            blockExplorerUrl: 'https://customblockexplorer.com/',
          }),
        },
      };

      expect(mapStateToProps(mockState)).toStrictEqual({
        conversionRate: 280.45,
        nativeCurrency: 'ETH',
        rpcPrefs: {
          blockExplorerUrl: 'https://customblockexplorer.com/',
        },
      });
    });
  });
});
