import assert from 'assert'
import proxyquire from 'proxyquire'

let mapStateToProps, mergeProps

proxyquire('../currency-display.container.js', {
  'react-redux': {
    connect: (ms, _, mp) => {
      mapStateToProps = ms
      mergeProps = mp
      return () => ({})
    },
  },
})

describe('CurrencyDisplay container', function () {
  describe('mapStateToProps()', function () {
    it('should return the correct props', function () {
      const mockState = {
        metamask: {
          conversionRate: 280.45,
          currentCurrency: 'usd',
          nativeCurrency: 'CFX',
        },
      }

      assert.deepEqual(mapStateToProps(mockState), {
        conversionRate: 280.45,
        currentCurrency: 'usd',
        nativeCurrency: 'CFX',
      })
    })
  })

  describe('mergeProps()', function () {
    it('should return the correct props', function () {
      const mockStateProps = {
        conversionRate: 280.45,
        currentCurrency: 'usd',
        nativeCurrency: 'CFX',
      }

      const tests = [
        {
          props: {
            value: '0x2386f26fc10000',
            numberOfDecimals: 2,
            currency: 'usd',
            nativeCurrency: 'CFX',
          },
          result: {
            hide: true,
            displayValue: '$2.80',
            suffix: 'USD',
            nativeCurrency: 'CFX',
          },
        },
        {
          props: {
            value: '0x2386f26fc10000',
            currency: 'usd',
            nativeCurrency: 'CFX',
          },
          result: {
            hide: true,
            displayValue: '$2.80',
            suffix: 'USD',
            nativeCurrency: 'CFX',
          },
        },
        {
          props: {
            value: '0x1193461d01595930',
            currency: 'CFX',
            nativeCurrency: 'CFX',
            numberOfDecimals: 3,
          },
          result: {
            displayValue: '1.266',
            suffix: 'CFX',
            nativeCurrency: 'CFX',
            hide: false,
          },
        },
        {
          props: {
            value: '0x1193461d01595930',
            currency: 'CFX',
            nativeCurrency: 'CFX',
            numberOfDecimals: 3,
            hideLabel: true,
          },
          result: {
            nativeCurrency: 'CFX',
            displayValue: '1.266',
            suffix: undefined,
            hide: false,
          },
        },
        {
          props: {
            value: '0x3b9aca00',
            currency: 'CFX',
            nativeCurrency: 'CFX',
            denomination: 'GWEI',
            hideLabel: true,
            hide: false,
          },
          result: {
            nativeCurrency: 'CFX',
            displayValue: '1',
            suffix: undefined,
            hide: false,
          },
        },
        {
          props: {
            value: '0x3b9aca00',
            currency: 'CFX',
            nativeCurrency: 'CFX',
            denomination: 'WEI',
            hideLabel: true,
          },
          result: {
            nativeCurrency: 'CFX',
            displayValue: '1000000000',
            suffix: undefined,
            hide: false,
          },
        },
        {
          props: {
            value: '0x3b9aca00',
            currency: 'CFX',
            nativeCurrency: 'CFX',
            numberOfDecimals: 100,
            hideLabel: true,
          },
          result: {
            nativeCurrency: 'CFX',
            displayValue: '0.000000001',
            suffix: undefined,
            hide: false,
          },
        },
      ]

      tests.forEach(({ props, result }) => {
        assert.deepEqual(mergeProps(mockStateProps, {}, { ...props }), result)
      })
    })
  })
})
