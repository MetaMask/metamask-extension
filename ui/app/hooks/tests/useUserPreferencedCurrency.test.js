import assert from 'assert'
import { renderHook } from '@testing-library/react-hooks'
import * as reactRedux from 'react-redux'
import sinon from 'sinon'
import { useUserPreferencedCurrency } from '../useUserPreferencedCurrency'
import { getPreferences, getShouldShowFiat } from '../../selectors'

const tests = [
  {
    state: {
      useNativeCurrencyAsPrimaryCurrency: true,
      nativeCurrency: 'ETH',
      showFiat: true,
    },
    params: {
      type: 'PRIMARY',
    },
    result: {
      currency: 'ETH',
      numberOfDecimals: 6,
    },
  },
  {
    state: {
      useNativeCurrencyAsPrimaryCurrency: false,
      nativeCurrency: 'ETH',
      showFiat: true,
    },
    params: {
      type: 'PRIMARY',
    },
    result: {
      currency: undefined,
      numberOfDecimals: 2,
    },
  },
  {
    state: {
      useNativeCurrencyAsPrimaryCurrency: true,
      nativeCurrency: 'ETH',
      showFiat: true,
    },
    params: {
      type: 'SECONDARY',
      fiatNumberOfDecimals: 4,
      fiatPrefix: '-',
    },
    result: {
      currency: undefined,
      numberOfDecimals: 4,
    },
  },
  {
    state: {
      useNativeCurrencyAsPrimaryCurrency: false,
      nativeCurrency: 'ETH',
      showFiat: true,
    },
    params: {
      type: 'SECONDARY',
      fiatNumberOfDecimals: 4,
      numberOfDecimals: 3,
      fiatPrefix: 'a',
    },
    result: {
      currency: 'ETH',
      numberOfDecimals: 3,
    },
  },
  {
    state: {
      useNativeCurrencyAsPrimaryCurrency: false,
      nativeCurrency: 'ETH',
      showFiat: false,
    },
    params: {
      type: 'PRIMARY',
    },
    result: {
      currency: 'ETH',
      numberOfDecimals: 6,
    },
  },
  {
    state: {
      useNativeCurrencyAsPrimaryCurrency: false,
      nativeCurrency: 'ETH',
      showFiat: true,
    },
    params: {
      type: 'PRIMARY',
    },
    result: {
      currency: undefined,
      numberOfDecimals: 2,
    },
  },
  {
    state: {
      useNativeCurrencyAsPrimaryCurrency: false,
      nativeCurrency: 'ETH',
      showFiat: true,
    },
    params: {
      type: 'PRIMARY',
    },
    result: {
      currency: undefined,
      numberOfDecimals: 2,
    },
  },
]

function getFakeUseSelector(state) {
  return (selector) => {
    if (selector === getPreferences) {
      return state
    } else if (selector === getShouldShowFiat) {
      return state.showFiat
    }
    return state.nativeCurrency
  }
}

describe('useUserPreferencedCurrency', function () {
  tests.forEach(({ params: { type, ...otherParams }, state, result }) => {
    describe(`when showFiat is ${state.showFiat}, useNativeCurrencyAsPrimary is ${state.useNativeCurrencyAsPrimaryCurrency} and type is ${type}`, function () {
      const stub = sinon.stub(reactRedux, 'useSelector')
      stub.callsFake(getFakeUseSelector(state))

      const { result: hookResult } = renderHook(() =>
        useUserPreferencedCurrency(type, otherParams),
      )
      stub.restore()
      it(`should return currency as ${
        result.currency || 'not modified by user preferences'
      }`, function () {
        assert.equal(hookResult.current.currency, result.currency)
      })
      it(`should return decimals as ${
        result.numberOfDecimals || 'not modified by user preferences'
      }`, function () {
        assert.equal(
          hookResult.current.numberOfDecimals,
          result.numberOfDecimals,
        )
      })
    })
  })
})
