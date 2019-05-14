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

describe('CurrencyDisplay container', () => {
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

      const tests = [
        {
          props: {
            value: '0x2386f26fc10000',
            numberOfDecimals: 2,
            currency: 'usd',
            nativeCurrency: 'ETH',
          },
          result: {
            displayValue: '$2.80',
            suffix: 'USD',
            nativeCurrency: 'ETH',
          },
        },
        {
          props: {
            value: '0x2386f26fc10000',
            currency: 'usd',
            nativeCurrency: 'ETH',
          },
          result: {
            displayValue: '$2.80',
            suffix: 'USD',
            nativeCurrency: 'ETH',
          },
        },
        {
          props: {
            value: '0x1193461d01595930',
            currency: 'ETH',
            nativeCurrency: 'ETH',
            numberOfDecimals: 3,
          },
          result: {
            displayValue: '1.266',
            suffix: 'ETH',
            nativeCurrency: 'ETH',
          },
        },
        {
          props: {
            value: '0x1193461d01595930',
            currency: 'ETH',
            nativeCurrency: 'ETH',
            numberOfDecimals: 3,
            hideLabel: true,
          },
          result: {
            nativeCurrency: 'ETH',
            displayValue: '1.266',
            suffix: undefined,
          },
        },
        {
          props: {
            value: '0x3b9aca00',
            currency: 'ETH',
            nativeCurrency: 'ETH',
            denomination: 'GWEI',
            hideLabel: true,
          },
          result: {
            nativeCurrency: 'ETH',
            displayValue: '1',
            suffix: undefined,
          },
        },
        {
          props: {
            value: '0x3b9aca00',
            currency: 'ETH',
            nativeCurrency: 'ETH',
            denomination: 'WEI',
            hideLabel: true,
          },
          result: {
            nativeCurrency: 'ETH',
            displayValue: '1000000000',
            suffix: undefined,
          },
        },
        {
          props: {
            value: '0x3b9aca00',
            currency: 'ETH',
            nativeCurrency: 'ETH',
            numberOfDecimals: 100,
            hideLabel: true,
          },
          result: {
            nativeCurrency: 'ETH',
            displayValue: '0.000000001',
            suffix: undefined,
          },
        },
      ]

      tests.forEach(({ props, result }) => {
        assert.deepEqual(mergeProps(mockStateProps, {}, { ...props }), result)
      })
    })
  })
})
