import React from 'react';
import { screen } from '@testing-library/react';
import configureStore from 'redux-mock-store';
import { useFiatFormatter } from '../../../../hooks/useFiatFormatter';
import { useHideFiatForTestnet } from '../../../../hooks/useHideFiatForTestnet';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import mockState from '../../../../../test/data/mock-state.json';
import { IndividualFiatDisplay, TotalFiatDisplay } from './fiat-display';
import { FIAT_UNAVAILABLE } from './types';

const store = configureStore()(mockState);

jest.mock('../../../../hooks/useFiatFormatter');
jest.mock('../../../../hooks/useHideFiatForTestnet');

describe('FiatDisplay', () => {
  const mockUseHideFiatForTestnet = jest.mocked(useHideFiatForTestnet);
  const mockUseFiatFormatter = jest.mocked(useFiatFormatter);

  beforeEach(() => {
    jest.resetAllMocks();
    mockUseHideFiatForTestnet.mockReturnValue(false);
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
          store,
        );
        expect(screen.getByText(expected)).toBeInTheDocument();
      },
    );

    it('does not render anything if hideFiatForTestnet is true', () => {
      mockUseHideFiatForTestnet.mockReturnValue(true);
      const { queryByText } = renderWithProvider(
        <IndividualFiatDisplay fiatAmount={100} />,
        store,
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
          store,
        );
        expect(screen.getByText(expected)).toBeInTheDocument();
      },
    );

    it('does not render anything if hideFiatForTestnet is true', () => {
      mockUseHideFiatForTestnet.mockReturnValue(true);
      const { queryByText } = renderWithProvider(
        <TotalFiatDisplay fiatAmounts={[100, 200, 300]} />,
        store,
      );
      expect(queryByText('600')).toBe(null);
    });
  });
});
