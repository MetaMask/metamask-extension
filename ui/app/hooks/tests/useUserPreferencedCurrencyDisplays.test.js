import assert from 'assert'
import { renderHook } from '@testing-library/react-hooks'
import * as reactRedux from 'react-redux'
import { useUserPreferencedCurrencyDisplays } from '../useUserPreferencedCurrencyDisplays'
import sinon from 'sinon'
import { getCurrentCurrency, getNativeCurrency, getConversionRate, getPreferences, getShouldShowFiat } from '../../selectors'

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
    },
    result: {
      primaryCurrencyDisplay: '1.222333 ETH',
      secondaryCurrencyDisplay: '$342.80 USD',
    },
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
      primaryPreferenceOpts: { ethNumberOfDecimals: 4 },
    },
    result: {
      primaryCurrencyDisplay: '1.2223 ETH',
      secondaryCurrencyDisplay: '$342.80 USD',
    },
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
      primaryPreferenceOpts: { numberOfDecimals: 4 },
      secondaryPreferenceOpts: { numberOfDecimals: 2 },
      primaryCurrencyOpts: { prefix: '!!!' },
      secondaryCurrencyOpts: { prefix: '!!!' },
    },
    result: {
      primaryCurrencyDisplay: '!!!61.1167 ETH',
      secondaryCurrencyDisplay: '!!!1.22Ƀ BTC',
    },
  },
]


describe('useUserPreferencedCurrencyDisplays', function () {
  tests.forEach(({ input: { value, ...restProps }, result, state }) => {
    describe(`when input is { value: ${value}, decimals: ${restProps.numberOfDecimals}, denomation: ${restProps.denomination} }`, function () {
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
      const hookReturn = renderHook(() => useUserPreferencedCurrencyDisplays(value, restProps))
      const { primaryCurrencyDisplay, secondaryCurrencyDisplay } = hookReturn.result.current
      stub.restore()
      it(`should return ${result.primaryCurrencyDisplay} as primaryCurrencyDisplay`, function () {
        assert.equal(primaryCurrencyDisplay, result.primaryCurrencyDisplay)
      })
      it(`should return ${result.secondaryCurrencyDisplay} as secondaryCurrencyDisplay`, function () {
        assert.equal(secondaryCurrencyDisplay, result.secondaryCurrencyDisplay)
      })
    })
  })
})
