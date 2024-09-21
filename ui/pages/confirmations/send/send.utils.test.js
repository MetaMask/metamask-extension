import { encode } from '@metamask/abi-utils';

import { TokenStandard } from '../../../../shared/constants/transaction';
import {
  generateERC20TransferData,
  isBalanceSufficient,
  isTokenBalanceSufficient,
  ellipsify,
  isERC1155BalanceSufficient,
  generateERC1155TransferData,
  getAssetTransferData,
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

  describe('isERC1155BalanceSufficient()', () => {
    it('should return true for a sufficient balance for erc1155 token spend', () => {
      const result = isERC1155BalanceSufficient({
        amount: '1',
        tokenBalance: '2',
      });

      expect(result).toStrictEqual(true);
    });

    it('should return false for an insufficient balance for erc1155 token spend', () => {
      const result = isERC1155BalanceSufficient({
        amount: '2',
        tokenBalance: '1',
      });

      expect(result).toStrictEqual(false);
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

  describe('getAssetTransferData', () => {
    const fromAddress = '0xFromAddress';
    const toAddress = '0xToAddress';
    const amount = '100';
    const tokenId = '1';

    it('generates ERC721 transfer data', () => {
      const sendToken = { standard: TokenStandard.ERC721, tokenId };
      const result = getAssetTransferData({
        sendToken,
        fromAddress,
        toAddress,
        amount,
      });
      const expected = generateERC721TransferData({
        toAddress,
        fromAddress,
        tokenId,
      });
      expect(result).toStrictEqual(expected);
    });

    it('generates ERC1155 transfer data', () => {
      const sendToken = { standard: TokenStandard.ERC1155, tokenId };
      const result = getAssetTransferData({
        sendToken,
        fromAddress,
        toAddress,
        amount,
      });
      const expected = generateERC1155TransferData({
        toAddress,
        fromAddress,
        tokenId,
      });
      expect(result).toStrictEqual(expected);
    });

    it('generates ERC20 transfer data', () => {
      const sendToken = { standard: TokenStandard.ERC20 };
      const result = getAssetTransferData({
        sendToken,
        fromAddress,
        toAddress,
        amount,
      });
      const expected = generateERC20TransferData({
        toAddress,
        amount,
        sendToken,
      });
      expect(result).toStrictEqual(expected);
    });

    it('generates ERC20 transfer data by default', () => {
      const sendToken = { standard: 'unknown' };
      const result = getAssetTransferData({
        sendToken,
        fromAddress,
        toAddress,
        amount,
      });
      const expected = generateERC20TransferData({
        toAddress,
        amount,
        sendToken,
      });
      expect(result).toStrictEqual(expected);
    });
  });
});
