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
          networkConfigurations: {},
          providerConfig: {
            ticker: 'ETH',
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
          networkConfigurations: {
            networkConfigurationId: {
              rpcUrl: 'https://customnetwork.com/',
            },
          },
          providerConfig: {
            rpcUrl: 'https://customnetwork.com/',
            ticker: 'ETH',
            rpcPrefs: {
              blockExplorerUrl: 'https://customblockexplorer.com/',
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
