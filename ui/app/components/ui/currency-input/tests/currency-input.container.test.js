import assert from 'assert'
import proxyquire from 'proxyquire'

let mapStateToProps, mergeProps

proxyquire('../currency-input.container.js', {
  'react-redux': {
    connect: (ms, _, mp) => {
      mapStateToProps = ms
      mergeProps = mp
      return () => ({})
    },
  },
})

describe('CurrencyInput container', function () {
  describe('mapStateToProps()', function () {
    const tests = [
      // Test # 1
      {
        comment: 'should return correct props in mainnet',
        mockState: {
          metamask: {
            conversionRate: 280.45,
            currentCurrency: 'usd',
            nativeCurrency: 'ETH',
            preferences: {
              showFiatInTestnets: false,
            },
            provider: {
              type: 'mainnet',
            },
            send: {
              maxModeOn: false,
            },
          },
        },
        expected: {
          conversionRate: 280.45,
          currentCurrency: 'usd',
          nativeCurrency: 'ETH',
          hideFiat: false,
          maxModeOn: false,
        },
      },
      // Test # 2
      {
        comment:
          'should return correct props when not in mainnet and showFiatInTestnets is false',
        mockState: {
          metamask: {
            conversionRate: 280.45,
            currentCurrency: 'usd',
            nativeCurrency: 'ETH',
            preferences: {
              showFiatInTestnets: false,
            },
            provider: {
              type: 'rinkeby',
            },
            send: {
              maxModeOn: false,
            },
          },
        },
        expected: {
          conversionRate: 280.45,
          currentCurrency: 'usd',
          nativeCurrency: 'ETH',
          hideFiat: true,
          maxModeOn: false,
        },
      },
      // Test # 3
      {
        comment:
          'should return correct props when not in mainnet and showFiatInTestnets is true',
        mockState: {
          metamask: {
            conversionRate: 280.45,
            currentCurrency: 'usd',
            nativeCurrency: 'ETH',
            preferences: {
              showFiatInTestnets: true,
            },
            provider: {
              type: 'rinkeby',
            },
            send: {
              maxModeOn: false,
            },
          },
        },
        expected: {
          conversionRate: 280.45,
          currentCurrency: 'usd',
          nativeCurrency: 'ETH',
          hideFiat: false,
          maxModeOn: false,
        },
      },
      // Test # 4
      {
        comment:
          'should return correct props when in mainnet and showFiatInTestnets is true',
        mockState: {
          metamask: {
            conversionRate: 280.45,
            currentCurrency: 'usd',
            nativeCurrency: 'ETH',
            preferences: {
              showFiatInTestnets: true,
            },
            provider: {
              type: 'mainnet',
            },
            send: {
              maxModeOn: false,
            },
          },
        },
        expected: {
          conversionRate: 280.45,
          currentCurrency: 'usd',
          nativeCurrency: 'ETH',
          hideFiat: false,
          maxModeOn: false,
        },
      },
    ]

    tests.forEach(({ mockState, expected, comment }) => {
      it(comment, function () {
        return assert.deepEqual(mapStateToProps(mockState), expected)
      })
    })
  })

  describe('mergeProps()', function () {
    const tests = [
      // Test # 1
      {
        comment: 'should return the correct props',
        mock: {
          stateProps: {
            conversionRate: 280.45,
            currentCurrency: 'usd',
            nativeCurrency: 'ETH',
          },
          dispatchProps: {},
          ownProps: {},
        },
        expected: {
          conversionRate: 280.45,
          currentCurrency: 'usd',
          nativeCurrency: 'ETH',
          // useFiat: true,
          nativeSuffix: 'ETH',
          fiatSuffix: 'USD',
        },
      },
      // Test # 1
      {
        comment: 'should return the correct props when useFiat is true',
        mock: {
          stateProps: {
            conversionRate: 280.45,
            currentCurrency: 'usd',
            nativeCurrency: 'ETH',
          },
          dispatchProps: {},
          ownProps: { useFiat: true },
        },
        expected: {
          conversionRate: 280.45,
          currentCurrency: 'usd',
          nativeCurrency: 'ETH',
          useFiat: true,
          nativeSuffix: 'ETH',
          fiatSuffix: 'USD',
        },
      },
    ]

    tests.forEach(
      ({
        mock: { stateProps, dispatchProps, ownProps },
        expected,
        comment,
      }) => {
        it(comment, function () {
          assert.deepEqual(
            mergeProps(stateProps, dispatchProps, ownProps),
            expected,
          )
        })
      },
    )
  })
})
