import React from 'react';
import { screen } from '@testing-library/react';
import configureStore from 'redux-mock-store';
import { useFiatFormatter } from '../../../../hooks/useFiatFormatter';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import mockState from '../../../../../test/data/mock-state.json';
import { IndividualFiatDisplay, TotalFiatDisplay } from './fiat-display';
import { FIAT_UNAVAILABLE } from './types';

const store = configureStore()(mockState);

jest.mock('../../../../hooks/useFiatFormatter');
(useFiatFormatter as jest.Mock).mockReturnValue((value: number) => `$${value}`);

describe('IndividualFiatDisplay', () => {
  it.each([
    [FIAT_UNAVAILABLE, 'Not Available'],
    [100, '$100'],
    [-100, '$100'],
  ])('when fiatAmount is %s it renders %s', (fiatAmount, expected) => {
    renderWithProvider(
      <IndividualFiatDisplay fiatAmount={fiatAmount} />,
      store,
    );
    expect(screen.getByText(expected)).toBeInTheDocument();
  });
});

describe('TotalFiatDisplay', () => {
  it.each([
    [[FIAT_UNAVAILABLE, FIAT_UNAVAILABLE], 'Not Available'],
    [[], 'Not Available'],
    [[100, 200, FIAT_UNAVAILABLE, 300], 'Total = $600'],
    [[-100, -200, FIAT_UNAVAILABLE, -300], 'Total = $600'],
  ])('when fiatAmounts is %s it renders %s', (fiatAmounts, expected) => {
    renderWithProvider(<TotalFiatDisplay fiatAmounts={fiatAmounts} />, store);
    expect(screen.getByText(expected)).toBeInTheDocument();
  });
});
