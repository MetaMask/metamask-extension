import React from 'react';
import { renderHook } from '@testing-library/react-hooks';
import { Provider } from 'react-redux';
import { BtcAccountType } from '@metamask/keyring-api';
import mockState from '../../test/data/mock-state.json';
import configureStore from '../store/store';
import { NativeAsset } from '../components/multichain/asset-picker-amount/asset-picker-modal/types';
import { AssetType } from '../../shared/constants/transaction';
import { createMockInternalAccount } from '../../test/jest/mocks';
import { useMultichainCurrencyDisplayByAsset } from './useMultichainCurrencyDisplayByAsset';

const mockAsset: NativeAsset & {
  balance: string;
  details: { decimals: number };
} = {
  balance: '1000000000000000000',
  details: { decimals: 8 },
  type: AssetType.native,
  // @ts-expect-error mock image
  image: './mock-image.svg',
  symbol: 'tBTC',
};

const mockBtcAccount = createMockInternalAccount({
  name: 'Btc Account',
  address: 'tb1qgaetv8fl5fs99jjyfamkxuvsly5fhq3dpkvmh5',
  type: BtcAccountType.P2wpkh,
});

const renderUseMultichainCurrencyDisplayByAsset = (
  assetDetails: NativeAsset & {
    balance: string;
    details: { decimals: number };
  },
  amount: string,
) => {
  const state = {
    ...mockState,
    metamask: {
      internalAccounts: {
        accounts: {
          [mockBtcAccount.id]: mockBtcAccount,
        },
        selectedAccount: mockBtcAccount.id,
      },
      rates: {
        [mockAsset.symbol.toLowerCase()]: {
          conversionDate: 1725928991326,
          conversionRate: 56830.37,
          usdConversionRate: 56830.37,
        },
      },
      currentCurrency: 'usd',
    },
  };

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <Provider store={configureStore(state)}>{children}</Provider>
  );

  return renderHook(
    () => useMultichainCurrencyDisplayByAsset({ assetDetails, amount }),
    {
      wrapper,
    },
  );
};

describe('useMultichainCurrencyDisplayByAsset', () => {
  it('should return the correct feeInFiat and displayValueFee when amount is "0"', () => {
    const amount = '0';

    const { result } = renderUseMultichainCurrencyDisplayByAsset(
      mockAsset,
      amount,
    );

    expect(result.current.fiatValue).toBe('$0.00');
    expect(result.current.displayValue).toBe(`0 ${mockAsset.symbol}`);
  });

  // @ts-expect-error This function is missing from the Mocha type definitions
  it.each([
    {
      amount: '0',
      expectedFeeInFiat: '$0.00',
      expectedDisplayValueFee: '0 tBTC',
    },
    {
      amount: '1',
      expectedFeeInFiat: '$56,830.37',
      expectedDisplayValueFee: '1 tBTC',
    },
    {
      amount: '1.23456789',
      expectedFeeInFiat: '$70,160.95',
      expectedDisplayValueFee: '1.23456789 tBTC',
    },
    {
      amount: '-1.23456789',
      expectedFeeInFiat: '-$70,160.95',
      expectedDisplayValueFee: '-1.23456789 tBTC',
    },
  ])(
    'should return the correct feeInFiat and displayValueFee when amount is "$amount"',
    ({
      amount,
      expectedFeeInFiat,
      expectedDisplayValueFee,
    }: {
      amount: string;
      expectedFeeInFiat: string;
      expectedDisplayValueFee: string;
    }) => {
      const { result } = renderUseMultichainCurrencyDisplayByAsset(
        mockAsset,
        amount,
      );

      expect(result.current.fiatValue).toBe(expectedFeeInFiat);
      expect(result.current.displayValue).toBe(expectedDisplayValueFee);
    },
  );
});
