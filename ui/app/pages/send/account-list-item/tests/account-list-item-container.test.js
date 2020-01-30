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
  '../send.selectors.js': {
    getConversionRate: () => `mockConversionRate`,
    getCurrentCurrency: () => `mockCurrentCurrency`,
    getNativeCurrency: () => `mockNativeCurrency`,
  },
  '../../../selectors/selectors': {
    isBalanceCached: () => `mockBalanceIsCached`,
    preferencesSelector: ({ showFiatInTestnets }) => ({
      showFiatInTestnets,
    }),
    getIsMainnet: ({ isMainnet }) => isMainnet,
  },
})

describe('account-list-item container', () => {

  describe('mapStateToProps()', () => {

    it('should map the correct properties to props', () => {
      assert.deepEqual(mapStateToProps({ isMainnet: true, showFiatInTestnets: false }), {
        conversionRate: 'mockConversionRate',
        currentCurrency: 'mockCurrentCurrency',
        nativeCurrency: 'mockNativeCurrency',
        balanceIsCached: 'mockBalanceIsCached',
        showFiat: true,
      })
    })

    it('should map the correct properties to props when in mainnet and showFiatInTestnet is true', () => {
      assert.deepEqual(mapStateToProps({ isMainnet: true, showFiatInTestnets: true }), {
        conversionRate: 'mockConversionRate',
        currentCurrency: 'mockCurrentCurrency',
        nativeCurrency: 'mockNativeCurrency',
        balanceIsCached: 'mockBalanceIsCached',
        showFiat: true,
      })
    })

    it('should map the correct properties to props when not in mainnet and showFiatInTestnet is true', () => {
      assert.deepEqual(mapStateToProps({ isMainnet: false, showFiatInTestnets: true }), {
        conversionRate: 'mockConversionRate',
        currentCurrency: 'mockCurrentCurrency',
        nativeCurrency: 'mockNativeCurrency',
        balanceIsCached: 'mockBalanceIsCached',
        showFiat: true,
      })
    })

    it('should map the correct properties to props when not in mainnet and showFiatInTestnet is false', () => {
      assert.deepEqual(mapStateToProps({ isMainnet: false, showFiatInTestnets: false }), {
        conversionRate: 'mockConversionRate',
        currentCurrency: 'mockCurrentCurrency',
        nativeCurrency: 'mockNativeCurrency',
        balanceIsCached: 'mockBalanceIsCached',
        showFiat: false,
      })
    })

  })

})
