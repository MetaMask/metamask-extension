import assert from 'assert'
import { ethers } from 'ethers'
import { renderHook } from '@testing-library/react-hooks'
import { useTokenData } from '../useTokenData'

const tests = [
  {
    data:
      '0xa9059cbb000000000000000000000000ffe5bc4e8f1f969934d773fa67da095d2e491a970000000000000000000000000000000000000000000000000000000000003a98',
    tokenData: {
      name: 'transfer',
      args: [
        '0xffe5bc4e8f1f969934d773fa67da095d2e491a97',
        ethers.BigNumber.from(15000),
      ],
    },
  },
  {
    data:
      '0xa9059cbb000000000000000000000000ffe5bc4e8f1f969934d773fa67da095d2e491a9700000000000000000000000000000000000000000000000000000000000061a8',
    tokenData: {
      name: 'transfer',
      args: [
        '0xffe5bc4e8f1f969934d773fa67da095d2e491a97',
        ethers.BigNumber.from(25000),
      ],
    },
  },
  {
    data:
      '0xa9059cbb000000000000000000000000ffe5bc4e8f1f969934d773fa67da095d2e491a970000000000000000000000000000000000000000000000000000000000002710',
    tokenData: {
      name: 'transfer',
      args: [
        '0xffe5bc4e8f1f969934d773fa67da095d2e491a97',
        ethers.BigNumber.from(10000),
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
    const testTitle =
      test.tokenData === null
        ? `should return null when no data provided`
        : `should return properly decoded data with _value ${test.tokenData.args[1].value}`
    it(testTitle, function () {
      const { result } = renderHook(() => useTokenData(test.data))
      if (test.tokenData) {
        assert.equal(result.current.name, test.tokenData.name)
        assert.equal(
          result.current.args[0].toLowerCase(),
          test.tokenData.args[0],
        )
        assert.ok(test.tokenData.args[1].eq(result.current.args[1]))
      } else {
        assert.equal(result.current, test.tokenData)
      }
    })
  })
})
