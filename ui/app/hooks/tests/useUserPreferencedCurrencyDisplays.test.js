import assert from 'assert'
import { renderHook } from '@testing-library/react-hooks'
import * as reactRedux from 'react-redux'
import { useUserPreferencedCurrencyDisplays } from '../useUserPreferencedCurrencyDisplays'
import sinon from 'sinon'
import { getCurrentCurrency, getNativeCurrency, getConversionRate, getPreferences, getShouldShowFiat } from '../../selectors'
import { PRIMARY, SECONDARY } from '../../helpers/constants/common'

const tests = [
  {
    state: {
      preferences: {
        useNativeCurrencyAsPrimaryCurrency: true,
        nativeCurrency: 'ETH',
        showFiat: true,
      },
    },
    input: {
      value: '0x10f699ca86b32800',
      type: PRIMARY,
    },
    result: '1.222333 ETH',
  },
  {
    state: {
      preferences: {
        useNativeCurrencyAsPrimaryCurrency: true,
        nativeCurrency: 'ETH',
        showFiat: true,
      },
    },
    input: {
      value: '0x10f699ca86b32800',
      type: SECONDARY,
      opts: { numberOfDecimals: 4 },
    },
    result: '$342.80 USD',
  },
  {
    state: {
      preferences: {
        useNativeCurrencyAsPrimaryCurrency: false,
        nativeCurrency: 'BTC',
        showFiat: true,
        conversionRate: 50,
        currentCurrency: 'eth',
      },
    },
    input: {
      value: '0x10f699ca86b32800',
      type: SECONDARY,
      opts: { numberOfDecimals: 2 },
    },
    result: '1.22Ƀ BTC',
  },
]


describe('useUserPreferencedCurrencyDisplays', function () {
  tests.forEach(({ input: { value, type, opts }, result, state }) => {
    describe(`when input is { value: ${value}, type: ${type}, decimals: ${opts?.numberOfDecimals || 'n/a'} }`, function () {
      const stub = sinon.stub(reactRedux, 'useSelector')
      stub.callsFake((selector) => {
        if (selector === getCurrentCurrency) {
          return state?.preferences?.currentCurrency || 'usd'
        } else if (selector === getNativeCurrency) {
          return state?.preferences?.nativeCurrency
        } else if (selector === getConversionRate) {
          return state?.preferences?.conversionRate || 280.45
        } else if (selector === getPreferences) {
          return state?.preferences
        } else if (selector === getShouldShowFiat) {
          return state?.preferences?.showFiat
        }
      })
      const hookReturn = renderHook(() => useUserPreferencedCurrencyDisplays(value, type, opts))
      const resultDisplay = hookReturn.result.current
      stub.restore()
      it(`should return ${result}`, function () {
        assert.equal(resultDisplay, result)
      })
    })
  })
})
