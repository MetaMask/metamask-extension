import assert from 'assert'
import proxyquire from 'proxyquire'

let mapStateToProps

proxyquire('../user-preferenced-token-input.container.js', {
  'react-redux': {
    connect: ms => {
      mapStateToProps = ms
      return () => ({})
    },
  },
})

describe('UserPreferencedTokenInput container', () => {
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
