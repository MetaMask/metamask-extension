import { ERC1155, ERC721 } from '@metamask/controller-utils';

import { EVM_NATIVE_ASSET } from '../../../../test/data/send/assets';
import {
  findNetworkClientIdByChainId,
  getLayer1GasFeeValue,
} from '../../../store/actions';
import { Asset } from '../types/send';
import {
  prepareEVMTransaction,
  submitEvmTransaction,
  fromTokenMinimalUnits,
  toTokenMinimalUnit,
  formatToFixedDecimals,
  isDecimal,
  convertedCurrency,
  navigateToSendRoute,
  getLayer1GasFees,
  trimTrailingZeros,
  removeAdditionalDecimalPlaces,
} from './send';

jest.mock('../../../store/actions', () => {
  return {
    ...jest.requireActual('../../../store/actions'),
    findNetworkClientIdByChainId: jest.fn().mockResolvedValue('mainnet'),
    getLayer1GasFeeValue: jest.fn(),
  };
});

describe('Send - utils', () => {
  describe('trimTrailingZeros', () => {
    it('removes trailing zeros', async () => {
      expect(trimTrailingZeros('0.001')).toBe('0.001');
      expect(trimTrailingZeros('0.00')).toBe('0');
      expect(trimTrailingZeros('0.001000')).toBe('0.001');
      expect(trimTrailingZeros('5.')).toBe('5');
    });
  });

  describe('fromTokenMinimalUnit', () => {
    it('return hex for the value with decimals multiplied', async () => {
      expect(fromTokenMinimalUnits('0xA', 18)).toBe('0x8ac7230489e80000');
      expect(fromTokenMinimalUnits('0xA', 0)).toBe('0xa');
    });
  });

  describe('toTokenMinimalUnit', () => {
    it('return hex for the value with decimals multiplied', async () => {
      expect(toTokenMinimalUnit('0xA', 18)).toBe('0.00000000000000001');
      expect(toTokenMinimalUnit('0x5ab79', 2)).toBe('3715.77');
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
        value: '0x56bc75e2d63100000',
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

  describe('navigateToSendRoute', () => {
    it('call history.push with send route', () => {
      const mockHistoryPush = jest.fn();
      navigateToSendRoute(
        {
          push: mockHistoryPush,
        },
        false,
      );
      expect(mockHistoryPush).toHaveBeenCalled();
    });
  });

  describe('isDecimal', () => {
    it('return true for decimal values and false otherwise', () => {
      expect(isDecimal('10')).toBe(true);
      expect(isDecimal('10.01')).toBe(true);
      expect(isDecimal('.01')).toBe(true);
      expect(isDecimal('-0.01')).toBe(true);
      expect(isDecimal('abc')).toBe(false);
      expect(isDecimal(' ')).toBe(false);
    });
  });

  describe('convertedCurrency', () => {
    it('return undefined for invalid input value', () => {
      expect(convertedCurrency('abc', 15, 2)).not.toBeDefined();
      expect(convertedCurrency('-10', 15, 4)).not.toBeDefined();
    });

    it('apply conversion rate to a currency', () => {
      expect(convertedCurrency('10.100125', 15, 2)).toBe('151.5');
      expect(convertedCurrency('10.111125', 15, 2)).toBe('151.66');
      expect(convertedCurrency('250', 0.00001, 4)).toBe('0.0025');
    });
  });

  describe('removeAdditionalDecimalPlaces', () => {
    it('return undefined is value is not defined', () => {
      expect(
        removeAdditionalDecimalPlaces(undefined as unknown as string, 2),
      ).not.toBeDefined();
      expect(
        removeAdditionalDecimalPlaces(null as unknown as string, 2),
      ).not.toBeDefined();
      expect(removeAdditionalDecimalPlaces('', 2)).not.toBeDefined();
    });

    it('remove additional decimal places', () => {
      expect(removeAdditionalDecimalPlaces('100.12345', 0)).toEqual('100');
      expect(removeAdditionalDecimalPlaces('100.12345', 2)).toEqual('100.12');
      expect(removeAdditionalDecimalPlaces('100.12345', 8)).toEqual(
        '100.12345',
      );
    });
  });

  describe('getLayer1GasFees', () => {
    it('call action getLayer1GasFeeValue with correct parameters', () => {
      getLayer1GasFees({
        asset: EVM_NATIVE_ASSET,
        chainId: '0x1',
        from: '0x123',
        value: '0x64',
      });
      expect(getLayer1GasFeeValue).toHaveBeenCalledWith({
        chainId: '0x1',
        transactionParams: { from: '0x123', value: '0x56bc75e2d63100000' },
      });
    });
  });
});
