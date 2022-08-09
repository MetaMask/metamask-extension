import React from 'react';
import configureMockStore from 'redux-mock-store';
import { within } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/jest/rendering';
import TransactionBreakdown from '.';

function getActualDataFrom(transactionBreakdownRows) {
  return transactionBreakdownRows.map((transactionBreakdownRow) => {
    const title = within(transactionBreakdownRow).getByTestId(
      'transaction-breakdown-row-title',
    );
    const value = within(transactionBreakdownRow).getByTestId(
      'transaction-breakdown-row-value',
    );
    return [title.textContent, value.textContent];
  });
}

describe('TransactionBreakdown', () => {
  const store = configureMockStore()({
    metamask: {
      nativeCurrency: null,
      preferences: {},
      provider: {
        chainId: null,
      },
    },
  });

  describe('with a typical non-EIP-1559 transaction', () => {
    it('renders properly', () => {
      const { getAllByTestId } = renderWithProvider(
        <TransactionBreakdown
          nonce="0x1d" // 29
          transaction={{
            txParams: {
              gas: '0xb72a', // 46,890
              gasPrice: '0x930c19db', // 2,467,043,803
              value: '0x2386f26fc10000', // 10,000,000,000,000,000
            },
          }}
          primaryCurrency="-0.01 ETH"
        />,
        store,
      );

      expect(
        getActualDataFrom(getAllByTestId('transaction-breakdown-row')),
      ).toStrictEqual([
        ['Nonce', '29'],
        ['Amount', '-0.01 ETH'],
        ['Gas limit (units)', '46890'],
        ['Gas price', '2.467043803'],
        ['Total', '0.01011568ETH'],
      ]);
    });
  });

  describe('with a typical EIP-1559 transaction', () => {
    it('renders properly', () => {
      const { getAllByTestId } = renderWithProvider(
        <TransactionBreakdown
          nonce="0x1d" // 29
          transaction={{
            txParams: {
              gas: '0xb72a', // 46,890
              maxFeePerGas: '0xb2d05e00', // 3,000,000,000
              maxPriorityFeePerGas: '0x930c19d4', // 2,467,043,796
              value: '0x2386f26fc10000', // 10,000,000,000,000,000
            },
            txReceipt: {
              gasUsed: '7a1c', // 31,260
              effectiveGasPrice: '0x930c19db', // 2,467,043,803
            },
            baseFeePerGas: '0x7', // 7
          }}
          primaryCurrency="-0.01 ETH"
        />,
        store,
      );

      expect(
        getActualDataFrom(getAllByTestId('transaction-breakdown-row')),
      ).toStrictEqual([
        ['Nonce', '29'],
        ['Amount', '-0.01 ETH'],
        ['Gas limit (units)', '46890'],
        ['Gas used (units)', '31260'],
        ['Base fee (GWEI)', '0.000000007'],
        ['Priority fee (GWEI)', '2.467043796'],
        ['Total gas fee', '0.000077ETH'],
        ['Max fee per gas', '0.000000003ETH'],
        ['Total', '0.01007712ETH'],
      ]);
    });
  });
});
