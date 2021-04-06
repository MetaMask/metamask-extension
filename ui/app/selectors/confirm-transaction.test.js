import assert from 'assert';
import {
  KOVAN_CHAIN_ID,
  KOVAN_NETWORK_ID,
  MAINNET_CHAIN_ID,
} from '../../../shared/constants/network';
import { TRANSACTION_TYPES } from '../../../shared/constants/transaction';
import {
  unconfirmedTransactionsCountSelector,
  sendTokenTokenAmountAndToAddressSelector,
  contractExchangeRateSelector,
  conversionRateSelector,
} from './confirm-transaction';

const getEthersArrayLikeFromObj = (obj) => {
  const arr = [];
  Object.keys(obj).forEach((key) => {
    arr.push([obj[key]]);
    arr[key] = obj[key];
  });
  return arr;
};

describe('Confirm Transaction Selector', function () {
  describe('unconfirmedTransactionsCountSelector', function () {
    const state = {
      metamask: {
        unapprovedTxs: {
          1: {
            metamaskNetworkId: KOVAN_NETWORK_ID,
          },
          2: {
            chainId: MAINNET_CHAIN_ID,
          },
        },
        unapprovedMsgCount: 1,
        unapprovedPersonalMsgCount: 1,
        unapprovedTypedMessagesCount: 1,
        network: KOVAN_NETWORK_ID,
        provider: {
          chainId: KOVAN_CHAIN_ID,
        },
      },
    };

    it('returns number of txs in unapprovedTxs state with the same network plus unapproved signing method counts', function () {
      assert.strictEqual(unconfirmedTransactionsCountSelector(state), 4);
    });
  });

  describe('sendTokenTokenAmountAndToAddressSelector', function () {
    const state = {
      confirmTransaction: {
        tokenData: {
          name: TRANSACTION_TYPES.TOKEN_METHOD_TRANSFER,
          args: getEthersArrayLikeFromObj({
            _to: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
            _value: { toString: () => '1' },
          }),
        },
        tokenProps: {
          tokenDecimals: '2',
          tokenSymbol: 'META',
        },
      },
    };

    it('returns token address and calculated token amount', function () {
      assert.deepStrictEqual(sendTokenTokenAmountAndToAddressSelector(state), {
        toAddress: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
        tokenAmount: '0.01',
      });
    });
  });

  describe('contractExchangeRateSelector', function () {
    const state = {
      metamask: {
        contractExchangeRates: {
          '0xTokenAddress': '10',
        },
      },
      confirmTransaction: {
        txData: {
          txParams: {
            to: '0xTokenAddress',
          },
        },
      },
    };

    it('returns contract exchange rate in metamask state based on confirm transaction txParams token recipient', function () {
      assert.strictEqual(contractExchangeRateSelector(state), '10');
    });
  });

  describe('conversionRateSelector', function () {
    it('returns conversionRate from state', function () {
      const state = {
        metamask: { conversionRate: 556.12 },
      };
      assert.strictEqual(conversionRateSelector(state), 556.12);
    });
  });
});
