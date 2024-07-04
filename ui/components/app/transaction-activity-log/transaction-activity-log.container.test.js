const { CHAIN_IDS } = require('../../../../shared/constants/network');

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
          networkConfigurationsByChainId: {
            [CHAIN_IDS.MAINNET]: {
              chainId: CHAIN_IDS.MAINNET,
              nativeCurrency: 'ETH',
              rpcEndpoints: [{}],
            },
          },
        },
      };

      expect(mapStateToProps(mockState)).toStrictEqual({
        conversionRate: 280.45,
        nativeCurrency: 'ETH',
        rpcPrefs: {},
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

          networkConfigurationsByChainId: {
            [CHAIN_IDS.MAINNET]: {
              chainId: CHAIN_IDS.MAINNET,
              nativeCurrency: 'ETH',
              blockExplorerUrl: 'https://customblockexplorer.com/',
              rpcEndpoints: [{}],
            },
          },
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
