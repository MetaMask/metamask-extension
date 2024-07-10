import { TransactionEnvelopeType } from '@metamask/transaction-controller';
import { HttpProvider } from '@metamask/ethjs';
import nock from 'nock';

import { EtherDenomination } from '../constants/common';
import { CHAIN_IDS } from '../constants/network';
import { Numeric } from '../modules/Numeric';
import {
  calcGasTotal,
  calcTokenAmount,
  getMethodDataAsync,
  getSwapsTokensReceivedFromTxMeta,
  TOKEN_TRANSFER_LOG_TOPIC_HASH,
} from './transactions-controller-utils';

describe('transaction controller utils', () => {
  describe('calcGasTotal()', () => {
    it('should correctly compute gasTotal', () => {
      const result = calcGasTotal(12, 15);
      expect(result).toStrictEqual('17a');
    });
  });

  describe('getSwapsTokensReceivedFromTxMeta', () => {
    it('returns null if txMeta is not well formed', () => {
      expect(getSwapsTokensReceivedFromTxMeta('ETH', {}, '0x00')).toBe(null);
    });

    it('returns null if tokenSymbol is the default for network but txMeta does not contain a receipt', () => {
      expect(
        getSwapsTokensReceivedFromTxMeta(
          'ETH',
          {},
          '0x00',
          '8',
          {},
          CHAIN_IDS.MAINNET,
        ),
      ).toBe(null);
    });

    it('returns null if tokenSymbol is the default for network but txMeta does not contain a preTxBalance', () => {
      expect(
        getSwapsTokensReceivedFromTxMeta(
          'ETH',
          { txReceipt: {}, postTxBalance: '0xe' },
          '0x00',
          '8',
          {},
          CHAIN_IDS.MAINNET,
        ),
      ).toBe(null);
    });

    it('returns null if tokenSymbol is the default for network but txMeta does not contain a postTxBalance', () => {
      expect(
        getSwapsTokensReceivedFromTxMeta(
          'ETH',
          { txReceipt: {}, preTxBalance: '0xe' },
          '0x00',
          '8',
          {},
          CHAIN_IDS.MAINNET,
        ),
      ).toBe(null);
    });

    it('returns estimated receiving amount if post and pre tx balances are the same', () => {
      expect(
        getSwapsTokensReceivedFromTxMeta(
          'ETH',
          {
            txReceipt: {},
            preTxBalance: '0xe',
            postTxBalance: '0xe',
            swapMetaData: { token_to_amount: '0x1' },
          },
          '0x00',
          '0x00',
          '8',
          {},
          CHAIN_IDS.MAINNET,
        ),
      ).toBe('0x1');
    });

    it('returns postTxBalance minus preTxBalance less the cost of gas of the transaction', () => {
      const preTxBalance = new Numeric('5000000', 10, EtherDenomination.WEI);
      const postTxBalance = new Numeric('5500000', 10, EtherDenomination.WEI);
      const gasUsed = new Numeric('28000', 10).toPrefixedHexString();
      const effectiveGasPrice = new Numeric('21', 10).toPrefixedHexString();
      const gasCost = calcGasTotal(gasUsed, effectiveGasPrice);
      const ethReceived = postTxBalance
        .minus(preTxBalance.minus(gasCost, 16))
        .toDenomination(EtherDenomination.ETH)
        .round(6);
      expect(
        getSwapsTokensReceivedFromTxMeta(
          'ETH',
          {
            txReceipt: {
              gasUsed,
              effectiveGasPrice,
              type: TransactionEnvelopeType.feeMarket,
            },
            preTxBalance: preTxBalance.toPrefixedHexString(),
            postTxBalance: postTxBalance.toPrefixedHexString(),
            swapMetaData: { token_to_amount: '0x1' },
          },
          '0x00',
          '0x00',
          '8',
          {},
          CHAIN_IDS.MAINNET,
        ),
      ).toBe(ethReceived.toString());
    });

    it('returns postTxBalance minus preTxBalance less the cost of gas of the transaction and the approval tx', () => {
      const preTxBalance = new Numeric('5000000', 10, EtherDenomination.WEI);
      const postTxBalance = new Numeric('5500000', 10, EtherDenomination.WEI);
      const gasUsed = new Numeric('28000', 10).toPrefixedHexString();
      const gasUsedApproval = new Numeric('75000', 10).toPrefixedHexString();
      const effectiveGasPrice = new Numeric('21', 10).toPrefixedHexString();
      const effectiveGasPriceApproval = new Numeric(
        '15',
        10,
      ).toPrefixedHexString();
      const gasCost = new Numeric(
        calcGasTotal(gasUsed, effectiveGasPrice),
        16,
      ).add(calcGasTotal(gasUsedApproval, effectiveGasPriceApproval), 16);
      const ethReceived = postTxBalance
        .minus(preTxBalance.minus(gasCost))
        .toDenomination(EtherDenomination.ETH)
        .round(6);
      expect(
        getSwapsTokensReceivedFromTxMeta(
          'ETH',
          {
            txReceipt: {
              gasUsed,
              effectiveGasPrice,
              type: TransactionEnvelopeType.feeMarket,
            },
            preTxBalance: preTxBalance.toPrefixedHexString(),
            postTxBalance: postTxBalance.toPrefixedHexString(),
            swapMetaData: { token_to_amount: '0x1' },
          },
          '0x00',
          '0x00',
          '8',
          {
            txReceipt: {
              gasUsed: gasUsedApproval,
              effectiveGasPrice: effectiveGasPriceApproval,
              type: TransactionEnvelopeType.feeMarket,
            },
          },
          CHAIN_IDS.MAINNET,
        ),
      ).toBe(ethReceived.toString());
    });

    it('returns postTxBalance minus preTxBalance less the cost of gas of the transaction and the approval tx for legacy txs', () => {
      const preTxBalance = new Numeric('5000000', 10, EtherDenomination.WEI);
      const postTxBalance = new Numeric('5500000', 10, EtherDenomination.WEI);
      const gasUsed = new Numeric('28000', 10).toPrefixedHexString();
      const gasUsedApproval = new Numeric('75000', 10).toPrefixedHexString();
      const gasPrice = new Numeric('21', 10).toPrefixedHexString();
      const gasPriceApproval = new Numeric('15', 10).toPrefixedHexString();
      const gasCost = new Numeric(calcGasTotal(gasUsed, gasPrice), 16).add(
        calcGasTotal(gasUsedApproval, gasPriceApproval),
        16,
      );
      const ethReceived = postTxBalance
        .minus(preTxBalance.minus(gasCost))
        .toDenomination(EtherDenomination.ETH)
        .round(6);
      expect(
        getSwapsTokensReceivedFromTxMeta(
          'ETH',
          {
            txReceipt: {
              gasUsed,
              type: TransactionEnvelopeType.legacy,
            },
            txParams: {
              gasPrice,
            },
            preTxBalance: preTxBalance.toPrefixedHexString(),
            postTxBalance: postTxBalance.toPrefixedHexString(),
            swapMetaData: { token_to_amount: '0x1' },
          },
          '0x00',
          '0x00',
          '8',
          {
            txReceipt: {
              gasUsed: gasUsedApproval,
              type: TransactionEnvelopeType.feeMarket,
            },
            txParams: {
              gasPrice: gasPriceApproval,
            },
          },
          CHAIN_IDS.MAINNET,
        ),
      ).toBe(ethReceived.toString());
    });

    it('returns value from tokenTransferLogs if not default token for network', () => {
      const logs = [
        {
          topics: [TOKEN_TRANSFER_LOG_TOPIC_HASH, '', '0x00'],
          address: '0x00',
          data: new Numeric('10000', 10).toPrefixedHexString(),
        },
      ];
      expect(
        getSwapsTokensReceivedFromTxMeta(
          'USDC',
          {
            txReceipt: { logs, status: '0x1' },
          },
          '0x00',
          '0x00',
          '8',
          {
            txReceipt: {},
          },
          CHAIN_IDS.MAINNET,
        ),
      ).toBe(calcTokenAmount(logs[0].data, 8).toString(10), 6);
    });
  });

  describe('getMethodDataAsync', () => {
    global.ethereumProvider = new HttpProvider(
      'https://mainnet.infura.io/v3/341eacb578dd44a1a049cbc5f6fd4035',
    );
    it('returns a valid signature for setApprovalForAll when use4ByteResolution privacy setting is ON', async () => {
      nock('https://www.4byte.directory:443', { encodedQueryParams: true })
        .get('/api/v1/signatures/')
        .query({ hex_signature: '0xa22cb465' })
        .reply(200, {
          count: 2,
          next: null,
          previous: null,
          results: [
            {
              id: 841519,
              created_at: '2022-06-12T00:50:19.305588Z',
              text_signature: 'niceFunctionHerePlzClick943230089(address,bool)',
              hex_signature: '0xa22cb465',
              bytes_signature: '¢,´e',
            },
            {
              id: 29659,
              created_at: '2018-04-11T21:47:39.980645Z',
              text_signature: 'setApprovalForAll(address,bool)',
              hex_signature: '0xa22cb465',
              bytes_signature: '¢,´e',
            },
          ],
        });
      expect(await getMethodDataAsync('0xa22cb465', true)).toStrictEqual({
        name: 'Set Approval For All',
        params: [{ type: 'address' }, { type: 'bool' }],
      });
    });
  });
});
