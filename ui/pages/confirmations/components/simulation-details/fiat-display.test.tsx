import React from 'react';
import { screen } from '@testing-library/react';
import configureStore from 'redux-mock-store';
import { merge } from 'lodash';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import mockState from '../../../../../test/data/mock-state.json';
import { mockNetworkState } from '../../../../../test/stub/networks';
import { CHAIN_IDS } from '../../../../../shared/constants/network';
import { IndividualFiatDisplay, TotalFiatDisplay } from './fiat-display';
import { FIAT_UNAVAILABLE } from './types';

const mockStateWithTestnet = merge({}, mockState, {
  metamask: {
    ...mockNetworkState({ chainId: CHAIN_IDS.SEPOLIA }),
  },
});

const mockStateWithShowingFiatOnTestnets = merge({}, mockStateWithTestnet, {
  metamask: {
    preferences: {
      showFiatInTestnets: true,
    },
    useCurrencyRateCheck: true,
    currencyRates: {
      SepoliaETH: {
        conversionRate: 1,
      },
    },
  },
});
const mockStoreWithShowingFiatOnTestnets = configureStore()(
  mockStateWithShowingFiatOnTestnets,
);

const mockStateWithHidingFiatOnTestnets = merge({}, mockStateWithTestnet, {
  metamask: {
    preferences: {
      showFiatInTestnets: false,
    },
    useCurrencyRateCheck: false,
  },
});
const mockStoreWithHidingFiatOnTestnets = configureStore()(
  mockStateWithHidingFiatOnTestnets,
);

describe('FiatDisplay', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('IndividualFiatDisplay', () => {
    // @ts-expect-error This is missing from the Mocha type definitions
    it.each([
      [100, '$100.00'],
      [-100, '$100.00'],
    ])(
      'when fiatAmount is %s it renders %s',
      (fiatAmount: number | null, expected: string) => {
        renderWithProvider(
          <IndividualFiatDisplay fiatAmount={fiatAmount} />,
          mockStoreWithShowingFiatOnTestnets,
        );
        expect(screen.getByText(expected)).toBeInTheDocument();
      },
    );

    it('does not render anything if user opted out to show fiat values on testnet', () => {
      const { queryByText } = renderWithProvider(
        <IndividualFiatDisplay fiatAmount={100} />,
        mockStoreWithHidingFiatOnTestnets,
      );
      expect(queryByText('100.00')).toBe(null);
    });
  });

  describe('TotalFiatDisplay', () => {
    // @ts-expect-error This is missing from the Mocha type definitions
    it.each([
      [[100, 200, FIAT_UNAVAILABLE, 300], 'Total = $600.00'],
      [[-100, -200, FIAT_UNAVAILABLE, -300], 'Total = $600.00'],
    ])(
      'when fiatAmounts is %s it renders %s',
      (fiatAmounts: (number | null)[], expected: string) => {
        renderWithProvider(
          <TotalFiatDisplay fiatAmounts={fiatAmounts} />,
          mockStoreWithShowingFiatOnTestnets,
        );
        expect(screen.getByText(expected)).toBeInTheDocument();
      },
    );

    it('does not render anything if user opted out to show fiat values on testnet', () => {
      const { queryByText } = renderWithProvider(
        <TotalFiatDisplay fiatAmounts={[100, 200, 300]} />,
        mockStoreWithHidingFiatOnTestnets,
      );
      expect(queryByText('600.00')).toBe(null);
    });

    // @ts-expect-error This is missing from the Mocha type definitions
    it.each([
      [
        [1_000_000_000_000_000, 2_000_000_000_000_000],
        'Total = $3,000,000,000,000...',
      ],
      [
        [-1_000_000_000_000_000, -2_000_000_000_000_000],
        'Total = $3,000,000,000,000...',
      ],
      [
        [1_234_567_890_123_456, 7_654_321_098_765_432],
        'Total = $8,888,888,988,888...',
      ],
      [[999_999_999_998, 1], 'Total = $999,999,999,999.00'], // Should not shorten
    ])(
      'when total fiat exceeds the limit %s, it shortens to %s',
      (fiatAmounts: (number | null)[], expected: string) => {
        renderWithProvider(
          <TotalFiatDisplay fiatAmounts={fiatAmounts} />,
          mockStoreWithShowingFiatOnTestnets,
        );
        expect(screen.getByText(expected)).toBeInTheDocument();
      },
    );

    it('renders "Not Available" when totalFiat is 0', () => {
      renderWithProvider(
        <TotalFiatDisplay fiatAmounts={[FIAT_UNAVAILABLE, FIAT_UNAVAILABLE]} />,
        mockStoreWithShowingFiatOnTestnets,
      );
      expect(screen.getByText('Not Available')).toBeInTheDocument();
    });
  });
});
