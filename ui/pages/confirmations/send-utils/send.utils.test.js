import { encode } from '@metamask/abi-utils';

import {
  generateERC20TransferData,
  generateERC20ApprovalData,
  isBalanceSufficient,
  ellipsify,
  generateERC1155TransferData,
  generateERC721TransferData,
} from './send.utils';

jest.mock('@metamask/abi-utils', () => ({
  encode: jest.fn().mockReturnValue(16, 1100),
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

    it('should call abi-utils.encode with the correct params', () => {
      generateERC20TransferData({
        toAddress: 'mockAddress',
        amount: 'ab',
        sendToken: { address: '0x0' },
      });
      expect(encode.mock.calls[0].toString()).toStrictEqual(
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

  describe('generateERC20ApprovalData()', () => {
    it('should return undefined if not passed a spender address', () => {
      expect(
        generateERC20ApprovalData({
          spenderAddress: null,
          amount: '0xa',
        }),
      ).toBeUndefined();
    });

    it('should call abi-utils.encode with the correct params', () => {
      encode.mockClear();
      generateERC20ApprovalData({
        spenderAddress: 'mockAddress',
        amount: 'ab',
      });
      expect(encode.mock.calls[0].toString()).toStrictEqual(
        [
          ['address', 'uint256'],
          ['0xmockAddress', '0xab'],
        ].toString(),
      );
    });

    it('should return encoded token approval data', () => {
      expect(
        generateERC20ApprovalData({
          spenderAddress: 'mockAddress',
          amount: '0xa',
        }),
      ).toStrictEqual('0x095ea7b3');
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

  describe('generateERC1155TransferData()', () => {
    it('should not return ERC1155 transfer data if tokenId is not defined', () => {
      const result = generateERC1155TransferData({
        toAddress: '0x0',
        fromAddress: '0x0',
        tokenId: null,
        amount: '1',
        data: '0',
      });

      expect(result).toStrictEqual(undefined);
    });

    it('should return erc1155 data transfer', () => {
      const result = generateERC1155TransferData({
        toAddress: '0x0',
        fromAddress: '0x0',
        tokenId: '1',
        amount: '1',
        data: '0',
      });

      expect(result).toBeDefined();
    });
  });

  describe('token transfer helpers', () => {
    const fromAddress = '0xFromAddress';
    const toAddress = '0xToAddress';
    const tokenId = '1';

    it('generates ERC721 transfer data', () => {
      const result = generateERC721TransferData({
        toAddress,
        fromAddress,
        tokenId,
      });
      expect(result).toBeDefined();
    });

    it('generates ERC1155 transfer data', () => {
      const result = generateERC1155TransferData({
        toAddress,
        fromAddress,
        tokenId,
        amount: '1',
      });
      expect(result).toBeDefined();
    });
  });
});
