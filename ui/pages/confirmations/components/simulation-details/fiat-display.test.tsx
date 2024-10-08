import React from 'react';
import { screen } from '@testing-library/react';
import configureStore from 'redux-mock-store';
import { merge } from 'lodash';
import { useFiatFormatter } from '../../../../hooks/useFiatFormatter';
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
  },
});
const mockStoreWithHidingFiatOnTestnets = configureStore()(
  mockStateWithHidingFiatOnTestnets,
);

jest.mock('../../../../hooks/useFiatFormatter');

describe('FiatDisplay', () => {
  const mockUseFiatFormatter = jest.mocked(useFiatFormatter);

  beforeEach(() => {
    jest.resetAllMocks();
    mockUseFiatFormatter.mockReturnValue((value: number) => `$${value}`);
  });

  describe('IndividualFiatDisplay', () => {
    // @ts-expect-error This is missing from the Mocha type definitions
    it.each([
      [FIAT_UNAVAILABLE, 'Not Available'],
      [100, '$100'],
      [-100, '$100'],
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
      expect(queryByText('100')).toBe(null);
    });
  });

  describe('TotalFiatDisplay', () => {
    // @ts-expect-error This is missing from the Mocha type definitions
    it.each([
      [[FIAT_UNAVAILABLE, FIAT_UNAVAILABLE], 'Not Available'],
      [[], 'Not Available'],
      [[100, 200, FIAT_UNAVAILABLE, 300], 'Total = $600'],
      [[-100, -200, FIAT_UNAVAILABLE, -300], 'Total = $600'],
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
        <IndividualFiatDisplay fiatAmount={100} />,
        mockStoreWithHidingFiatOnTestnets,
      );
      expect(queryByText('600')).toBe(null);
    });
  });
});
