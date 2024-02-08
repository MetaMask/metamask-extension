import { BigNumber } from '@ethersproject/bignumber';
import { TransactionEnvelopeType } from '@metamask/transaction-controller';
import { GAS_LIMITS } from '../../../shared/constants/gas';
import {
  AssetType,
  TokenStandard,
} from '../../../shared/constants/transaction';
import { BURN_ADDRESS } from '../../../shared/modules/hexstring-utils';
import { getInitialSendStateWithExistingTxState } from '../../../test/jest/mocks';
import {
  generateERC1155TransferData,
  generateERC20TransferData,
  generateERC721TransferData,
} from '../../pages/confirmations/send/send.utils';
import { generateTransactionParams } from './helpers';

describe('Send Slice Helpers', () => {
  describe('generateTransactionParams', () => {
    it('should generate a txParams for a token transfer', () => {
      const tokenDetails = {
        address: '0xToken',
        symbol: 'SYMB',
        decimals: 18,
      };
      const txParams = generateTransactionParams(
        getInitialSendStateWithExistingTxState({
          fromAccount: {
            address: '0x00',
          },
          amount: {
            value: '0x1',
          },
          asset: {
            type: AssetType.token,
            balance: '0xaf',
            details: tokenDetails,
          },
          recipient: {
            address: BURN_ADDRESS,
          },
        }),
      );
      expect(txParams).toStrictEqual({
        from: '0x00',
        data: generateERC20TransferData({
          toAddress: BURN_ADDRESS,
          amount: '0x1',
          sendToken: tokenDetails,
        }),
        to: '0xToken',
        type: '0x0',
        value: '0x0',
        gas: '0x0',
        gasPrice: '0x0',
      });
    });

    it('should generate a txParams for an NFT transfer', () => {
      const txParams = generateTransactionParams(
        getInitialSendStateWithExistingTxState({
          fromAccount: {
            address: '0x00',
          },
          amount: {
            value: '0x1',
          },
          asset: {
            type: AssetType.NFT,
            balance: '0xaf',
            details: {
              address: '0xToken',
              standard: TokenStandard.ERC721,
              tokenId: BigNumber.from(15000).toString(),
            },
          },
          recipient: {
            address: BURN_ADDRESS,
          },
        }),
      );
      expect(txParams).toStrictEqual({
        from: '0x00',
        data: generateERC721TransferData({
          toAddress: BURN_ADDRESS,
          fromAddress: '0x00',
          tokenId: BigNumber.from(15000).toString(),
        }),
        to: '0xToken',
        type: '0x0',
        value: '0x0',
        gas: '0x0',
        gasPrice: '0x0',
      });
    });

    it('should generate a txParams for an ERC1155 transfer', () => {
      const txParams = generateTransactionParams(
        getInitialSendStateWithExistingTxState({
          fromAccount: {
            address: '0x00',
          },
          amount: {
            value: '0x1',
          },
          asset: {
            type: AssetType.NFT,
            balance: '0xaf',
            details: {
              address: '0xToken',
              standard: TokenStandard.ERC1155,
              tokenId: BigNumber.from(15000).toString(),
            },
          },
          recipient: {
            address: BURN_ADDRESS,
          },
        }),
      );
      expect(txParams).toStrictEqual({
        from: '0x00',
        data: generateERC1155TransferData({
          toAddress: BURN_ADDRESS,
          fromAddress: '0x00',
          tokenId: BigNumber.from(15000).toString(),
        }),
        to: '0xToken',
        type: '0x0',
        value: '0x0',
        gas: '0x0',
        gasPrice: '0x0',
      });
    });

    it('should generate a txParams for a native legacy transaction', () => {
      const txParams = generateTransactionParams(
        getInitialSendStateWithExistingTxState({
          fromAccount: {
            address: '0x00',
          },
          amount: {
            value: '0x1',
          },
          asset: {
            type: AssetType.native,
            balance: '0xaf',
            details: null,
          },
          recipient: {
            address: BURN_ADDRESS,
          },
        }),
      );
      expect(txParams).toStrictEqual({
        from: '0x00',
        data: undefined,
        to: BURN_ADDRESS,
        type: '0x0',
        value: '0x1',
        gas: '0x0',
        gasPrice: '0x0',
      });
    });

    it('should generate a txParams for a native fee market transaction', () => {
      const txParams = generateTransactionParams({
        ...getInitialSendStateWithExistingTxState({
          fromAccount: {
            address: '0x00',
          },
          amount: {
            value: '0x1',
          },
          asset: {
            type: AssetType.native,
            balance: '0xaf',
            details: null,
          },
          recipient: {
            address: BURN_ADDRESS,
          },
          gas: {
            maxFeePerGas: '0x2',
            maxPriorityFeePerGas: '0x1',
            gasLimit: GAS_LIMITS.SIMPLE,
          },
          transactionType: TransactionEnvelopeType.feeMarket,
        }),
        eip1559support: true,
      });
      expect(txParams).toStrictEqual({
        from: '0x00',
        data: undefined,
        to: BURN_ADDRESS,
        type: '0x2',
        value: '0x1',
        gas: GAS_LIMITS.SIMPLE,
        maxFeePerGas: '0x2',
        maxPriorityFeePerGas: '0x1',
      });
    });
  });
});
