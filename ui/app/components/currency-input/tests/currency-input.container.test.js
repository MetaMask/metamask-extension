import assert from 'assert'
import proxyquire from 'proxyquire'

let mapStateToProps, mergeProps

proxyquire('../currency-input.container.js', {
  'react-redux': {
    connect: (ms, md, mp) => {
      mapStateToProps = ms
      mergeProps = mp
      return () => ({})
    },
  },
})

describe('CurrencyInput container', () => {
  describe('mapStateToProps()', () => {
    it('should return the correct props', () => {
      const mockState = {
        metamask: {
          conversionRate: 280.45,
          currentCurrency: 'usd',
          nativeCurrency: 'ETH',
        },
      }

      assert.deepEqual(mapStateToProps(mockState), {
        conversionRate: 280.45,
        currentCurrency: 'usd',
        nativeCurrency: 'ETH',
      })
    })
  })

  describe('mergeProps()', () => {
    it('should return the correct props', () => {
      const mockStateProps = {
        conversionRate: 280.45,
        currentCurrency: 'usd',
        nativeCurrency: 'ETH',
      }
      const mockDispatchProps = {}

      assert.deepEqual(mergeProps(mockStateProps, mockDispatchProps, { useFiat: true }), {
        conversionRate: 280.45,
        currentCurrency: 'usd',
        nativeCurrency: 'ETH',
        useFiat: true,
        nativeSuffix: 'ETH',
        fiatSuffix: 'USD',
      })

      assert.deepEqual(mergeProps(mockStateProps, mockDispatchProps, {}), {
        conversionRate: 280.45,
        currentCurrency: 'usd',
        nativeCurrency: 'ETH',
        nativeSuffix: 'ETH',
        fiatSuffix: 'USD',
      })
    })
  })
})
