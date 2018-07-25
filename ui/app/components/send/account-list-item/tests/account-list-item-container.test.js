import assert from 'assert'
import proxyquire from 'proxyquire'

let mapStateToProps

proxyquire('../account-list-item.container.js', {
  'react-redux': {
    connect: (ms, md) => {
      mapStateToProps = ms
      return () => ({})
    },
  },
  '../send.selectors.js': {
    getConversionRate: (s) => `mockConversionRate:${s}`,
    getCurrentCurrency: (s) => `mockCurrentCurrency:${s}`,
  },
})

describe('account-list-item container', () => {

  describe('mapStateToProps()', () => {

    it('should map the correct properties to props', () => {
      assert.deepEqual(mapStateToProps('mockState'), {
        conversionRate: 'mockConversionRate:mockState',
        currentCurrency: 'mockCurrentCurrency:mockState',
      })
    })

  })

})
