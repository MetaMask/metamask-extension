import assert from 'assert'
import { renderHook } from '@testing-library/react-hooks'
import { useTokenData } from '../useTokenData'

const tests = [
  {
    data: '0xa9059cbb000000000000000000000000ffe5bc4e8f1f969934d773fa67da095d2e491a970000000000000000000000000000000000000000000000000000000000003a98',
    tokenData: {
      'name': 'transfer',
      'params': [
        {
          'name': '_to',
          'value': '0xffe5bc4e8f1f969934d773fa67da095d2e491a97',
          'type': 'address',
        },
        {
          'name': '_value',
          'value': '15000',
          'type': 'uint256',
        },
      ],
    },
  },
  {
    data: '0xa9059cbb000000000000000000000000ffe5bc4e8f1f969934d773fa67da095d2e491a9700000000000000000000000000000000000000000000000000000000000061a8',
    tokenData: {
      'name': 'transfer',
      'params': [
        {
          'name': '_to',
          'value': '0xffe5bc4e8f1f969934d773fa67da095d2e491a97',
          'type': 'address',
        },
        {
          'name': '_value',
          'value': '25000',
          'type': 'uint256',
        },
      ],
    },
  },
  {
    data: '0xa9059cbb000000000000000000000000ffe5bc4e8f1f969934d773fa67da095d2e491a970000000000000000000000000000000000000000000000000000000000002710',
    tokenData: {
      'name': 'transfer',
      'params': [
        {
          'name': '_to',
          'value': '0xffe5bc4e8f1f969934d773fa67da095d2e491a97',
          'type': 'address',
        },
        {
          'name': '_value',
          'value': '10000',
          'type': 'uint256',
        },
      ],
    },
  },
  {
    data: undefined,
    tokenData: null,
  },
]

describe('useTokenData', function () {
  tests.forEach((test) => {
    const testTitle = test.tokenData === null
      ? `should return null when no data provided`
      : `should return properly decoded data with _value ${test.tokenData.params[1].value}`
    it(testTitle, function () {
      const { result } = renderHook(() => useTokenData(test.data))
      assert.deepEqual(result.current, test.tokenData)
    })
  })
})
