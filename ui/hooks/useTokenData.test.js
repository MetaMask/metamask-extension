/* eslint-disable jest/no-conditional-expect */
import { BigNumber } from '@ethersproject/bignumber';
import { renderHook } from '@testing-library/react-hooks';
import { TransactionType } from '@metamask/transaction-controller';
import { useTokenData } from './useTokenData';

const tests = [
  {
    data: '0xa9059cbb000000000000000000000000ffe5bc4e8f1f969934d773fa67da095d2e491a970000000000000000000000000000000000000000000000000000000000003a98',
    tokenData: {
      name: TransactionType.tokenMethodTransfer,
      args: [
        '0xffe5bc4e8f1f969934d773fa67da095d2e491a97',
        BigNumber.from(15000),
      ],
    },
  },
  {
    data: '0xa9059cbb000000000000000000000000ffe5bc4e8f1f969934d773fa67da095d2e491a9700000000000000000000000000000000000000000000000000000000000061a8',
    tokenData: {
      name: TransactionType.tokenMethodTransfer,
      args: [
        '0xffe5bc4e8f1f969934d773fa67da095d2e491a97',
        BigNumber.from(25000),
      ],
    },
  },
  {
    data: '0xa9059cbb000000000000000000000000ffe5bc4e8f1f969934d773fa67da095d2e491a970000000000000000000000000000000000000000000000000000000000002710',
    tokenData: {
      name: TransactionType.tokenMethodTransfer,
      args: [
        '0xffe5bc4e8f1f969934d773fa67da095d2e491a97',
        BigNumber.from(10000),
      ],
    },
  },
  {
    data: undefined,
    tokenData: null,
  },
];

describe('useTokenData', () => {
  tests.forEach(({ data, tokenData }) => {
    const testTitle =
      // eslint-disable-next-line no-negated-condition
      tokenData !== null
        ? `should return properly decoded data with _value ${tokenData.args[1]}`
        : `should return null when no data provided`;
    it(`${testTitle}`, () => {
      const { result } = renderHook(() => useTokenData(data));
      if (tokenData) {
        expect(result.current.name).toStrictEqual(tokenData.name);
        expect(result.current.args[0].toLowerCase()).toStrictEqual(
          tokenData.args[0],
        );
        expect(tokenData.args[1].toHexString()).toStrictEqual(
          result.current.args[1].toHexString(),
        );
      } else {
        expect(result.current).toStrictEqual(tokenData);
      }
    });
  });
});
