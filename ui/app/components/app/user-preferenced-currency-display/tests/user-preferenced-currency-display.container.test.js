import assert from 'assert'
import proxyquire from 'proxyquire'

let mapStateToProps, mergeProps

proxyquire('../user-preferenced-currency-display.container.js', {
  'react-redux': {
    connect: (ms, _, mp) => {
      mapStateToProps = ms
      mergeProps = mp
      return () => ({})
    },
  },
})

describe('UserPreferencedCurrencyDisplay container', () => {
  describe('mapStateToProps()', () => {
    it('should return the correct props', () => {
      const mockState = {
        metamask: {
          nativeCurrency: 'ETH',
          preferences: {
            useNativeCurrencyAsPrimaryCurrency: true,
            showFiatInTestnets: false,
          },
          provider: {
            type: 'mainnet',
          },
        },
      }

      assert.deepEqual(mapStateToProps(mockState), {
        nativeCurrency: 'ETH',
        useNativeCurrencyAsPrimaryCurrency: true,
        isMainnet: true,
        showFiatInTestnets: false,
      })
    })

    it('should return the correct props when not in mainnet and showFiatInTestnets is true', () => {
      const mockState = {
        metamask: {
          nativeCurrency: 'ETH',
          preferences: {
            useNativeCurrencyAsPrimaryCurrency: true,
            showFiatInTestnets: true,
          },
          provider: {
            type: 'rinkeby',
          },
        },
      }

      assert.deepEqual(mapStateToProps(mockState), {
        nativeCurrency: 'ETH',
        useNativeCurrencyAsPrimaryCurrency: true,
        isMainnet: false,
        showFiatInTestnets: true,
      })
    })
  })

  describe('mergeProps()', () => {
    it('should return the correct props', () => {
      const mockDispatchProps = {}

      const tests = [
        {
          stateProps: {
            useNativeCurrencyAsPrimaryCurrency: true,
            nativeCurrency: 'ETH',
            isMainnet: true,
            showFiatInTestnets: false,
          },
          ownProps: {
            type: 'PRIMARY',
          },
          result: {
            currency: 'ETH',
            nativeCurrency: 'ETH',
            numberOfDecimals: 6,
            prefix: undefined,
          },
        },
        {
          stateProps: {
            useNativeCurrencyAsPrimaryCurrency: false,
            nativeCurrency: 'ETH',
            isMainnet: true,
            showFiatInTestnets: false,
          },
          ownProps: {
            type: 'PRIMARY',
          },
          result: {
            currency: undefined,
            nativeCurrency: 'ETH',
            numberOfDecimals: 2,
            prefix: undefined,
          },
        },
        {
          stateProps: {
            useNativeCurrencyAsPrimaryCurrency: true,
            nativeCurrency: 'ETH',
            isMainnet: true,
            showFiatInTestnets: false,
          },
          ownProps: {
            type: 'SECONDARY',
            fiatNumberOfDecimals: 4,
            fiatPrefix: '-',
          },
          result: {
            nativeCurrency: 'ETH',
            currency: undefined,
            numberOfDecimals: 4,
            prefix: '-',
          },
        },
        {
          stateProps: {
            useNativeCurrencyAsPrimaryCurrency: false,
            nativeCurrency: 'ETH',
            isMainnet: true,
            showFiatInTestnets: false,
          },
          ownProps: {
            type: 'SECONDARY',
            fiatNumberOfDecimals: 4,
            numberOfDecimals: 3,
            fiatPrefix: 'a',
            prefix: 'b',
          },
          result: {
            currency: 'ETH',
            nativeCurrency: 'ETH',
            numberOfDecimals: 3,
            prefix: 'b',
          },
        },
        {
          stateProps: {
            useNativeCurrencyAsPrimaryCurrency: false,
            nativeCurrency: 'ETH',
            isMainnet: false,
            showFiatInTestnets: false,
          },
          ownProps: {
            type: 'PRIMARY',
          },
          result: {
            currency: 'ETH',
            nativeCurrency: 'ETH',
            numberOfDecimals: 6,
            prefix: undefined,
          },
        },
        {
          stateProps: {
            useNativeCurrencyAsPrimaryCurrency: false,
            nativeCurrency: 'ETH',
            isMainnet: false,
            showFiatInTestnets: true,
          },
          ownProps: {
            type: 'PRIMARY',
          },
          result: {
            currency: undefined,
            nativeCurrency: 'ETH',
            numberOfDecimals: 2,
            prefix: undefined,
          },
        },
        {
          stateProps: {
            useNativeCurrencyAsPrimaryCurrency: false,
            nativeCurrency: 'ETH',
            isMainnet: true,
            showFiatInTestnets: true,
          },
          ownProps: {
            type: 'PRIMARY',
          },
          result: {
            currency: undefined,
            nativeCurrency: 'ETH',
            numberOfDecimals: 2,
            prefix: undefined,
          },
        },
      ]

      tests.forEach(({ stateProps, ownProps, result }) => {
        assert.deepEqual(mergeProps({ ...stateProps }, mockDispatchProps, { ...ownProps }), {
          ...result,
        })
      })
    })
  })
})
