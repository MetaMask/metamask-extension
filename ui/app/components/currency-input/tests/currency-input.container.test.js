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
        },
      }

      assert.deepEqual(mapStateToProps(mockState), {
        conversionRate: 280.45,
        currentCurrency: 'usd',
      })
    })
  })

  describe('mergeProps()', () => {
    it('should return the correct props', () => {
      const mockStateProps = {
        conversionRate: 280.45,
        currentCurrency: 'usd',
      }
      const mockDispatchProps = {}

      assert.deepEqual(mergeProps(mockStateProps, mockDispatchProps, { useFiat: true }), {
        conversionRate: 280.45,
        currentCurrency: 'usd',
        useFiat: true,
        suffix: 'USD',
      })

      assert.deepEqual(mergeProps(mockStateProps, mockDispatchProps, {}), {
        conversionRate: 280.45,
        currentCurrency: 'usd',
        suffix: 'ETH',
      })
    })
  })
})
