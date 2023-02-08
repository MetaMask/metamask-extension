import { rawEncode } from 'ethereumjs-abi';

import {
  generateERC20TransferData,
  isBalanceSufficient,
  isTokenBalanceSufficient,
  ellipsify,
} from './send.utils';

jest.mock('ethereumjs-abi', () => ({
  rawEncode: jest.fn().mockReturnValue(16, 1100),
}));

describe('send utils', () => {
  describe('generateERC20TransferData()', () => {
    it('should return undefined if not passed a send token', () => {
      expect(
        generateERC20TransferData({
          toAddress: 'mockAddress',
          amount: '0xa',
          sendToken: undefined,
        }),
      ).toBeUndefined();
    });

    it('should call abi.rawEncode with the correct params', () => {
      generateERC20TransferData({
        toAddress: 'mockAddress',
        amount: 'ab',
        sendToken: { address: '0x0' },
      });
      expect(rawEncode.mock.calls[0].toString()).toStrictEqual(
        [
          ['address', 'uint256'],
          ['0xmockAddress', '0xab'],
        ].toString(),
      );
    });

    it('should return encoded token transfer data', () => {
      expect(
        generateERC20TransferData({
          toAddress: 'mockAddress',
          amount: '0xa',
          sendToken: { address: '0x0' },
        }),
      ).toStrictEqual('0xa9059cbb');
    });
  });

  describe('isBalanceSufficient()', () => {
    it('should correctly sum the appropriate currencies and ensure that balance is greater', () => {
      const result = isBalanceSufficient({
        amount: 15,
        balance: 100,
        conversionRate: 3,
        gasTotal: 17,
        primaryCurrency: 'ABC',
      });
      expect(result).toStrictEqual(true);
    });
  });

  describe('isTokenBalanceSufficient()', () => {
    it('should return true for a sufficient balance for token spend', () => {
      const result = isTokenBalanceSufficient({
        amount: '0x10',
        tokenBalance: 123,
        decimals: 10,
      });

      expect(result).toStrictEqual(true);
    });

    it('should return false for an insufficient balance for token spend', () => {
      const result = isTokenBalanceSufficient({
        amount: '0x10000',
        tokenBalance: 123,
        decimals: 10,
      });

      expect(result).toStrictEqual(true);
    });
  });

  describe('ellipsify()', () => {
    it('should ellipsify a contract address', () => {
      expect(
        ellipsify('0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC'),
      ).toStrictEqual('0xCcCC...cccC');
    });

    it('should return an empty string if the passed text is not defined', () => {
      expect(ellipsify(undefined)).toStrictEqual('');
    });
  });
});
