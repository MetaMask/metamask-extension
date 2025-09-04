import { ERC1155, ERC721 } from '@metamask/controller-utils';

import { EVM_NATIVE_ASSET } from '../../../../test/data/send/assets';
import { findNetworkClientIdByChainId } from '../../../store/actions';
import { SEND_ROUTE } from '../../../helpers/constants/routes';
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
} from './send';

const mockUseNavigate = jest.fn();
jest.mock('react-router-dom-v5-compat', () => {
  return {
    ...jest.requireActual('react-router-dom-v5-compat'),
    useNavigate: () => mockUseNavigate,
  };
});

jest.mock('../../../store/actions', () => {
  return {
    ...jest.requireActual('../../../store/actions'),
    findNetworkClientIdByChainId: jest.fn().mockResolvedValue('mainnet'),
  };
});

describe('Send - utils', () => {
  describe('fromTokenMinimalUnit', () => {
    it('return hex for the value with decimals multiplied', async () => {
      expect(fromTokenMinimalUnits('0xA', 18)).toBe('8ac7230489e80000');
      expect(fromTokenMinimalUnits('0xA', 0)).toBe('a');
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

  describe('navigateToSendRoute', () => {
    const originalEnv = process.env.SEND_REDESIGN_ENABLED;

    beforeEach(() => {
      jest.clearAllMocks();
    });

    afterEach(() => {
      process.env.SEND_REDESIGN_ENABLED = originalEnv;
    });

    describe('when SEND_REDESIGN_ENABLED is disabled', () => {
      beforeEach(() => {
        delete process.env.SEND_REDESIGN_ENABLED;
      });

      it('should navigate to legacy send route without params', () => {
        navigateToSendRoute(mockUseNavigate);

        expect(mockUseNavigate).toHaveBeenCalledWith({
          pathname: SEND_ROUTE,
        });
      });

      it('should navigate to legacy send route with params (ignores params)', () => {
        navigateToSendRoute(mockUseNavigate, {
          address: '0x123',
          chainId: '0x1',
        });

        expect(mockUseNavigate).toHaveBeenCalledWith({
          pathname: SEND_ROUTE,
        });
      });
    });

    describe('when SEND_REDESIGN_ENABLED is enabled', () => {
      beforeEach(() => {
        process.env.SEND_REDESIGN_ENABLED = 'true';
      });

      it('should navigate to asset selection when no params provided', () => {
        navigateToSendRoute(mockUseNavigate);

        expect(mockUseNavigate).toHaveBeenCalledWith({
          pathname: `${SEND_ROUTE}/asset`,
        });
      });

      it('should navigate to amount-recipient with address param only', () => {
        navigateToSendRoute(mockUseNavigate, {
          address: '0x123',
        });

        expect(mockUseNavigate).toHaveBeenCalledWith({
          pathname: `${SEND_ROUTE}/amount-recipient`,
          search: 'asset=0x123',
        });
      });

      it('should navigate to amount-recipient with chainId param only', () => {
        navigateToSendRoute(mockUseNavigate, {
          chainId: '0x1',
        });

        expect(mockUseNavigate).toHaveBeenCalledWith({
          pathname: `${SEND_ROUTE}/amount-recipient`,
          search: 'chainId=0x1',
        });
      });

      it('should navigate to amount-recipient with both address and chainId params', () => {
        navigateToSendRoute(mockUseNavigate, {
          address: '0x123',
          chainId: '0x1',
        });

        expect(mockUseNavigate).toHaveBeenCalledWith({
          pathname: `${SEND_ROUTE}/amount-recipient`,
          search: 'asset=0x123&chainId=0x1',
        });
      });

      it('should navigate to amount-recipient with empty params object', () => {
        navigateToSendRoute(mockUseNavigate, {});

        expect(mockUseNavigate).toHaveBeenCalledWith({
          pathname: `${SEND_ROUTE}/amount-recipient`,
          search: '',
        });
      });

      it('should handle special characters in address param', () => {
        navigateToSendRoute(mockUseNavigate, {
          address: '0xaBcDeF123456789',
          chainId: '0xa',
        });

        expect(mockUseNavigate).toHaveBeenCalledWith({
          pathname: `${SEND_ROUTE}/amount-recipient`,
          search: 'asset=0xaBcDeF123456789&chainId=0xa',
        });
      });
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
      expect(convertedCurrency('abc', 15)).not.toBeDefined();
      expect(convertedCurrency('-10', 15)).not.toBeDefined();
    });

    it('apply conversion rate to a currency', () => {
      expect(convertedCurrency('10.100', 15)).toBe('151.5');
      expect(convertedCurrency('250', 0.001)).toBe('0.25');
    });
  });
});
