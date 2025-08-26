import { ERC1155, ERC721 } from '@metamask/controller-utils';

import { EVM_NATIVE_ASSET } from '../../../../test/data/send/assets';
import { findNetworkClientIdByChainId } from '../../../store/actions';
import { Asset } from '../types/send';
import {
  prepareEVMTransaction,
  submitEvmTransaction,
  fromTokenMinimalUnit,
  toTokenMinimalUnit,
  formatToFixedDecimals,
} from './send';

jest.mock('../../../store/actions', () => {
  return {
    ...jest.requireActual('../../../store/actions'),
    findNetworkClientIdByChainId: jest.fn().mockResolvedValue('mainnet'),
  };
});

describe('Send - utils', () => {
  describe('fromTokenMinimalUnit', () => {
    it('return hex for the value with decimals multiplied', async () => {
      expect(fromTokenMinimalUnit('0xA', 18)).toBe('8ac7230489e80000');
      expect(fromTokenMinimalUnit('0xA', 0)).toBe('0xA');
    });
  });

  describe('toTokenMinimalUnit', () => {
    it('return hex for the value with decimals multiplied', async () => {
      expect(toTokenMinimalUnit('0xA', 18)).toBe('0.00000000000000001');
      expect(toTokenMinimalUnit('0x5', 5)).toBe('0.00005');
      expect(toTokenMinimalUnit('0xA', 0)).toBe('10');
    });
  });

  describe('formatToFixedDecimals', () => {
    it('return `0` is value is equivalent to 0', () => {
      expect(formatToFixedDecimals('0.0000')).toEqual('0');
    });
    it('return correct string for very small values', () => {
      expect(formatToFixedDecimals('0.01', 1)).toEqual('< 0.1');
      expect(formatToFixedDecimals('0.001', 2)).toEqual('< 0.01');
      expect(formatToFixedDecimals('0.0001', 3)).toEqual('< 0.001');
      expect(formatToFixedDecimals('0.00001', 4)).toEqual('< 0.0001');
    });
    it('formats value with passed number of decimals', () => {
      expect(formatToFixedDecimals('1', 4)).toEqual('1');
      expect(formatToFixedDecimals('1.01010101', 4)).toEqual('1.0101');
    });
  });

  describe('prepareEVMTransaction', () => {
    it('prepares transaction for native token', () => {
      expect(
        prepareEVMTransaction(EVM_NATIVE_ASSET, {
          from: '0x123',
          to: '0x456',
          value: '0x64',
        }),
      ).toStrictEqual({
        data: '0x',
        from: '0x123',
        to: '0x456',
        value: '56bc75e2d63100000',
      });
    });

    it('prepares transaction for ERC20 token', () => {
      expect(
        prepareEVMTransaction(
          {
            name: 'MyToken',
            address: '0x123',
            chainId: '0x1',
          } as Asset,
          { from: '0x123', to: '0x456', value: '0x64' },
        ),
      ).toStrictEqual({
        data: '0xa9059cbb00000000000000000000000000000000000000000000000000000000000004560000000000000000000000000000000000000000000000000000000000000064',
        from: '0x123',
        to: '0x123',
        value: '0x0',
      });
    });

    it('prepares transaction for ERC1155 token', () => {
      expect(
        prepareEVMTransaction(
          {
            name: 'MyNFT',
            address: '0x123',
            chainId: '0x1',
            tokenId: '0x1',
            standard: ERC1155,
          } as Asset,
          { from: '0x123', to: '0x456', value: '0x64' },
        ),
      ).toStrictEqual({
        data: '0xf242432a000000000000000000000000000000000000000000000000000000000000012300000000000000000000000000000000000000000000000000000000000004560000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000006400000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000',
        from: '0x123',
        to: '0x123',
        value: '0x0',
      });
    });

    it('prepares transaction for ERC721 token', () => {
      expect(
        prepareEVMTransaction(
          {
            name: 'MyNFT',
            address: '0x123',
            chainId: '0x1',
            tokenId: '0x1',
            standard: ERC721,
          } as Asset,
          { from: '0x123', to: '0x456', value: '1' },
        ),
      ).toStrictEqual({
        data: '0x23b872dd000000000000000000000000000000000000000000000000000000000000012300000000000000000000000000000000000000000000000000000000000004560000000000000000000000000000000000000000000000000000000000000001',
        from: '0x123',
        to: '0x123',
        value: '0x0',
      });
    });
  });

  describe('submitEvmTransaction', () => {
    it('call functions to get networkClientId and then submit transaction', () => {
      submitEvmTransaction({
        asset: EVM_NATIVE_ASSET,
        chainId: '0x1',
        from: '0x123',
        to: '0x456',
        value: '0x64',
      });
      expect(findNetworkClientIdByChainId).toHaveBeenCalledWith('0x1');
    });
  });
});
