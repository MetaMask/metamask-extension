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

describe('UserPreferencedCurrencyDisplay container', function () {
  describe('mapStateToProps()', function () {
    it('should return the correct props', function () {
      const mockState = {
        metamask: {
          nativeCurrency: 'CFX',
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
        nativeCurrency: 'CFX',
        useNativeCurrencyAsPrimaryCurrency: true,
        isMainnet: true,
        showFiatInTestnets: false,
      })
    })

    it('should return the correct props when not in mainnet and showFiatInTestnets is true', function () {
      const mockState = {
        metamask: {
          nativeCurrency: 'CFX',
          preferences: {
            useNativeCurrencyAsPrimaryCurrency: true,
            showFiatInTestnets: false,
          },
          provider: {
            type: 'rinkeby',
          },
        },
      }

      assert.deepEqual(mapStateToProps(mockState), {
        nativeCurrency: 'CFX',
        useNativeCurrencyAsPrimaryCurrency: true,
        isMainnet: false,
        showFiatInTestnets: false,
      })
    })
  })

  describe('mergeProps()', function () {
    it('should return the correct props', function () {
      const mockDispatchProps = {}

      const tests = [
        {
          stateProps: {
            useNativeCurrencyAsPrimaryCurrency: true,
            nativeCurrency: 'CFX',
            isMainnet: true,
            showFiatInTestnets: false,
          },
          ownProps: {
            type: 'PRIMARY',
          },
          result: {
            currency: 'CFX',
            nativeCurrency: 'CFX',
            numberOfDecimals: 6,
            prefix: undefined,
          },
        },
        {
          stateProps: {
            useNativeCurrencyAsPrimaryCurrency: false,
            nativeCurrency: 'CFX',
            isMainnet: true,
            showFiatInTestnets: false,
          },
          ownProps: {
            type: 'PRIMARY',
          },
          result: {
            currency: undefined,
            nativeCurrency: 'CFX',
            numberOfDecimals: 2,
            prefix: undefined,
          },
        },
        {
          stateProps: {
            useNativeCurrencyAsPrimaryCurrency: true,
            nativeCurrency: 'CFX',
            isMainnet: true,
            showFiatInTestnets: false,
          },
          ownProps: {
            type: 'SECONDARY',
            fiatNumberOfDecimals: 4,
            fiatPrefix: '-',
          },
          result: {
            nativeCurrency: 'CFX',
            currency: undefined,
            numberOfDecimals: 4,
            prefix: '-',
          },
        },
        {
          stateProps: {
            useNativeCurrencyAsPrimaryCurrency: false,
            nativeCurrency: 'CFX',
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
            currency: 'CFX',
            nativeCurrency: 'CFX',
            numberOfDecimals: 3,
            prefix: 'b',
          },
        },
        {
          stateProps: {
            useNativeCurrencyAsPrimaryCurrency: false,
            nativeCurrency: 'CFX',
            isMainnet: false,
            showFiatInTestnets: false,
          },
          ownProps: {
            type: 'PRIMARY',
          },
          result: {
            currency: 'CFX',
            nativeCurrency: 'CFX',
            numberOfDecimals: 6,
            prefix: undefined,
          },
        },
        {
          stateProps: {
            useNativeCurrencyAsPrimaryCurrency: false,
            nativeCurrency: 'CFX',
            isMainnet: false,
            showFiatInTestnets: true,
          },
          ownProps: {
            type: 'PRIMARY',
          },
          result: {
            currency: undefined,
            nativeCurrency: 'CFX',
            numberOfDecimals: 2,
            prefix: undefined,
          },
        },
        {
          stateProps: {
            useNativeCurrencyAsPrimaryCurrency: false,
            nativeCurrency: 'CFX',
            isMainnet: true,
            showFiatInTestnets: true,
          },
          ownProps: {
            type: 'PRIMARY',
          },
          result: {
            currency: undefined,
            nativeCurrency: 'CFX',
            numberOfDecimals: 2,
            prefix: undefined,
          },
        },
      ]

      tests.forEach(({ stateProps, ownProps, result }) => {
        assert.deepEqual(
          mergeProps({ ...stateProps }, mockDispatchProps, { ...ownProps }),
          {
            ...result,
          }
        )
      })
    })
  })
})
