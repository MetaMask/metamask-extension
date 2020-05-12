import assert from 'assert'
import { renderHook } from '@testing-library/react-hooks'
import * as tokenUtil from '../../helpers/utils/token-util'
import * as txUtil from '../../helpers/utils/transactions.util'
import { useTokenDisplayValue } from '../useTokenDisplayValue'
import sinon from 'sinon'

const tests = [
  {
    token: {
      symbol: 'DAI',
      decimals: 18,
    },
    tokenData: {
      params: 'decoded-params1',
    },
    tokenValue: '1000000000000000000',
    displayValue: '1',
  },
  {
    token: {
      symbol: 'DAI',
      decimals: 18,
    },
    tokenData: {
      params: 'decoded-params2',
    },
    tokenValue: '10000000000000000000',
    displayValue: '10',
  },
  {
    token: {
      symbol: 'DAI',
      decimals: 18,
    },
    tokenData: {
      params: 'decoded-params3',
    },
    tokenValue: '1500000000000000000',
    displayValue: '1.5',
  },
  {
    token: {
      symbol: 'DAI',
      decimals: 18,
    },
    tokenData: {
      params: 'decoded-params4',
    },
    tokenValue: '1756000000000000000',
    displayValue: '1.756',
  },
  {
    token: {
      symbol: 'DAI',
      decimals: 18,
    },
    tokenData: {
      params: 'decoded-params5',
    },
    tokenValue: '25500000000000000000',
    displayValue: '25.5',
  },
  {
    token: {
      symbol: 'USDC',
      decimals: 6,
    },
    tokenData: {
      params: 'decoded-params6',
    },
    tokenValue: '1000000',
    displayValue: '1',
  },
  {
    token: {
      symbol: 'USDC',
      decimals: 6,
    },
    tokenData: {
      params: 'decoded-params7',
    },
    tokenValue: '10000000',
    displayValue: '10',
  },
  {
    token: {
      symbol: 'USDC',
      decimals: 6,
    },
    tokenData: {
      params: 'decoded-params8',
    },
    tokenValue: '1500000',
    displayValue: '1.5',
  },
  {
    token: {
      symbol: 'USDC',
      decimals: 6,
    },
    tokenData: {
      params: 'decoded-params9',
    },
    tokenValue: '1756000',
    displayValue: '1.756',
  },
  {
    token: {
      symbol: 'USDC',
      decimals: 6,
    },
    tokenData: {
      params: 'decoded-params10',
    },
    tokenValue: '25500000',
    displayValue: '25.5',
  },
]


describe('useTokenDisplayValue', function () {
  tests.forEach((test, idx) => {
    describe(`when input is decimals: ${test.token.decimals} and value: ${test.tokenValue}`, function () {
      it(`should return ${test.displayValue} as displayValue`, function () {
        const getTokenValueStub = sinon.stub(tokenUtil, 'getTokenValue')
        const getTokenDataStub = sinon.stub(txUtil, 'getTokenData')
        getTokenDataStub.callsFake(() => test.tokenData)
        getTokenValueStub.callsFake(() => test.tokenValue)
        const { result } = renderHook(() => useTokenDisplayValue(`${idx}-fakestring`, test.token))
        sinon.restore()
        assert.equal(result.current, test.displayValue)
      })
    })
  })
})
