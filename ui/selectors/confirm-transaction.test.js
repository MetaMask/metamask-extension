import { TransactionType } from '@metamask/transaction-controller';
import {
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

describe('Confirm Transaction Selector', () => {
  describe('sendTokenTokenAmountAndToAddressSelector', () => {
    const state = {
      confirmTransaction: {
        tokenData: {
          name: TransactionType.tokenMethodTransfer,
          args: getEthersArrayLikeFromObj({
            _to: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
            _value: { toString: () => '1' },
          }),
        },
        tokenProps: {
          decimals: '2',
          symbol: 'META',
        },
      },
    };

    it('returns token address and calculated token amount', () => {
      expect(sendTokenTokenAmountAndToAddressSelector(state)).toStrictEqual({
        toAddress: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
        tokenAmount: '0.01',
      });
    });
  });

  describe('contractExchangeRateSelector', () => {
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

    it('returns contract exchange rate in metamask state based on confirm transaction txParams token recipient', () => {
      expect(contractExchangeRateSelector(state)).toStrictEqual('10');
    });
  });

  describe('conversionRateSelector', () => {
    it('returns conversionRate from state', () => {
      const state = {
        metamask: {
          currencyRates: {
            ETH: {
              conversionRate: 556.12,
            },
          },
          providerConfig: { ticker: 'ETH' },
        },
      };
      expect(conversionRateSelector(state)).toStrictEqual(556.12);
    });
  });
});
