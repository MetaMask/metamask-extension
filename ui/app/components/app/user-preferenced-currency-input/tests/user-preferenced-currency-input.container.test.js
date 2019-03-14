import assert from 'assert'
import proxyquire from 'proxyquire'

let mapStateToProps

proxyquire('../user-preferenced-currency-input.container.js', {
  'react-redux': {
    connect: ms => {
      mapStateToProps = ms
      return () => ({})
    },
  },
})

describe('UserPreferencedCurrencyInput container', () => {
  describe('mapStateToProps()', () => {
    it('should return the correct props', () => {
      const mockState = {
        metamask: {
          preferences: {
            useNativeCurrencyAsPrimaryCurrency: true,
          },
        },
      }

      assert.deepEqual(mapStateToProps(mockState), {
        useNativeCurrencyAsPrimaryCurrency: true,
      })
    })
  })
})
