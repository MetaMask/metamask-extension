import assert from 'assert'
import proxyquire from 'proxyquire'

let mapStateToProps

proxyquire('../account-list-item.container.js', {
  'react-redux': {
    connect: (ms) => {
      mapStateToProps = ms
      return () => ({})
    },
  },
  '../../../selectors': {
    getConversionRate: () => `mockConversionRate`,
    getCurrentCurrency: () => `mockCurrentCurrency`,
    getNativeCurrency: () => `mockNativeCurrency`,
    isBalanceCached: () => `mockBalanceIsCached`,
    getPreferences: ({ showFiatInTestnets }) => ({
      showFiatInTestnets,
    }),
    getIsMainnet: ({ isMainnet }) => isMainnet,
  },
})

describe('account-list-item container', function () {

  describe('mapStateToProps()', function () {

    it('should map the correct properties to props', function () {
      assert.deepEqual(mapStateToProps({ isMainnet: true, showFiatInTestnets: false }), {
        nativeCurrency: 'mockNativeCurrency',
        balanceIsCached: 'mockBalanceIsCached',
        showFiat: true,
      })
    })

    it('should map the correct properties to props when in mainnet and showFiatInTestnet is true', function () {
      assert.deepEqual(mapStateToProps({ isMainnet: true, showFiatInTestnets: true }), {
        nativeCurrency: 'mockNativeCurrency',
        balanceIsCached: 'mockBalanceIsCached',
        showFiat: true,
      })
    })

    it('should map the correct properties to props when not in mainnet and showFiatInTestnet is true', function () {
      assert.deepEqual(mapStateToProps({ isMainnet: false, showFiatInTestnets: true }), {
        nativeCurrency: 'mockNativeCurrency',
        balanceIsCached: 'mockBalanceIsCached',
        showFiat: true,
      })
    })

    it('should map the correct properties to props when not in mainnet and showFiatInTestnet is false', function () {
      assert.deepEqual(mapStateToProps({ isMainnet: false, showFiatInTestnets: false }), {
        nativeCurrency: 'mockNativeCurrency',
        balanceIsCached: 'mockBalanceIsCached',
        showFiat: false,
      })
    })

  })

})
