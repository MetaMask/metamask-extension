/* eslint-disable jest/no-conditional-expect */
import { ethers } from 'ethers';
import { renderHook } from '@testing-library/react-hooks';
import { TRANSACTION_TYPES } from '../../shared/constants/transaction';
import { useTokenData } from './useTokenData';

const tests = [
  {
    data:
      '0xa9059cbb000000000000000000000000ffe5bc4e8f1f969934d773fa67da095d2e491a970000000000000000000000000000000000000000000000000000000000003a98',
    tokenData: {
      name: TRANSACTION_TYPES.TOKEN_METHOD_TRANSFER,
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
      name: TRANSACTION_TYPES.TOKEN_METHOD_TRANSFER,
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
      name: TRANSACTION_TYPES.TOKEN_METHOD_TRANSFER,
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
];

describe('useTokenData', () => {
  tests.forEach((test) => {
    const testTitle =
      // eslint-disable-next-line no-negated-condition
      test.tokenData !== null
        ? `should return properly decoded data with _value ${test.tokenData.args[1]}`
        : `should return null when no data provided`;
    it(`${testTitle}`, () => {
      const { result } = renderHook(() => useTokenData(test.data));
      if (test.tokenData) {
        expect(result.current.name).toStrictEqual(test.tokenData.name);
        expect(result.current.args[0].toLowerCase()).toStrictEqual(
          test.tokenData.args[0],
        );
        expect(test.tokenData.args[1]).toStrictEqual(result.current.args[1]);
      } else {
        expect(result.current).toStrictEqual(test.tokenData);
      }
    });
  });
});
