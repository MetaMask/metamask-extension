import { ERC1155, ERC721 } from '@metamask/controller-utils';
import { TransactionMeta } from '@metamask/transaction-controller';

import { EVM_NATIVE_ASSET } from '../../../../test/data/send/assets';
import {
  addTransactionAndRouteToConfirmationPage,
  findNetworkClientIdByChainId,
} from '../../../store/actions';
import { Asset } from '../types/send';
import {
  prepareEVMTransaction,
  submitEvmTransaction,
  toTokenMinimalUnit,
} from './send';

jest.mock('../../../store/actions', () => {
  return {
    ...jest.requireActual('../../../store/actions'),
    findNetworkClientIdByChainId: jest.fn().mockResolvedValue('mainnet'),
  };
});

describe('Send - utils', () => {
  describe('toTokenMinimalUnit', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it('return hex for the value with decimals multiplied', async () => {
      expect(toTokenMinimalUnit('0xA', 18)).toBe('8ac7230489e80000');
      expect(toTokenMinimalUnit('0xA', 0)).toBe('0xA');
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
        data: '0x23b872dd000000000000000000000000000000000000000000000000000000000000012300000000000000000000000000000000000000000000000000000000000004560000000000000000000000000000000000000000000000000000000000000001',
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
