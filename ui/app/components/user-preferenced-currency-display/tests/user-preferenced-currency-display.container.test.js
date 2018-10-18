import assert from 'assert'
import proxyquire from 'proxyquire'

let mapStateToProps, mergeProps

proxyquire('../user-preferenced-currency-display.container.js', {
  'react-redux': {
    connect: (ms, md, mp) => {
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
          fromCurrency: 'ETH',
          preferences: {
            useETHAsPrimaryCurrency: true,
          },
        },
      }

      assert.deepEqual(mapStateToProps(mockState), {
        fromCurrency: 'ETH',
        useETHAsPrimaryCurrency: true,
      })
    })
  })

  describe('mergeProps()', () => {
    it('should return the correct props', () => {
      const mockDispatchProps = {}

      const tests = [
        {
          stateProps: {
            useETHAsPrimaryCurrency: true,
          },
          ownProps: {
            type: 'PRIMARY',
          },
          result: {
            currency: 'ETH',
            numberOfDecimals: 6,
            prefix: undefined,
          },
        },
        {
          stateProps: {
            useETHAsPrimaryCurrency: false,
          },
          ownProps: {
            type: 'PRIMARY',
          },
          result: {
            currency: undefined,
            numberOfDecimals: 2,
            prefix: undefined,
          },
        },
        {
          stateProps: {
            useETHAsPrimaryCurrency: true,
          },
          ownProps: {
            type: 'SECONDARY',
            fiatNumberOfDecimals: 4,
            fiatPrefix: '-',
          },
          result: {
            currency: undefined,
            numberOfDecimals: 4,
            prefix: '-',
          },
        },
        {
          stateProps: {
            useETHAsPrimaryCurrency: false,
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
            numberOfDecimals: 3,
            prefix: 'b',
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
