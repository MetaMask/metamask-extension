import assert from 'assert';
import proxyquire from 'proxyquire';

let mapStateToProps;

proxyquire('./transaction-activity-log.container.js', {
  'react-redux': {
    connect: (ms) => {
      mapStateToProps = ms;
      return () => ({});
    },
  },
});

describe('TransactionActivityLog container', function () {
  describe('mapStateToProps()', function () {
    it('should return the correct props', function () {
      const mockState = {
        metamask: {
          conversionRate: 280.45,
          nativeCurrency: 'ETH',
          frequentRpcListDetail: [],
        },
      };

      assert.deepStrictEqual(mapStateToProps(mockState), {
        conversionRate: 280.45,
        nativeCurrency: 'ETH',
        rpcPrefs: {},
      });
    });

    it('should return the correct props when on a custom network', function () {
      const mockState = {
        metamask: {
          conversionRate: 280.45,
          nativeCurrency: 'ETH',
          frequentRpcListDetail: [
            {
              rpcUrl: 'https://customnetwork.com/',
              rpcPrefs: {
                blockExplorerUrl: 'https://customblockexplorer.com/',
              },
            },
          ],
          provider: {
            rpcUrl: 'https://customnetwork.com/',
          },
        },
      };

      assert.deepStrictEqual(mapStateToProps(mockState), {
        conversionRate: 280.45,
        nativeCurrency: 'ETH',
        rpcPrefs: {
          blockExplorerUrl: 'https://customblockexplorer.com/',
        },
      });
    });
  });
});
