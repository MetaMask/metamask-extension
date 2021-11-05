import React from 'react';
import { screen } from '@testing-library/react';

import { ETH } from '../../../helpers/constants/common';
import { renderWithProvider } from '../../../../test/jest';
import configureStore from '../../../store/store';

import GasDetailsItem from './gas-details-item';

const render = (props) => {
  const store = configureStore({
    metamask: {
      nativeCurrency: ETH,
      preferences: {
        useNativeCurrencyAsPrimaryCurrency: true,
      },
      provider: {},
    },
  });

  return renderWithProvider(<GasDetailsItem txData={{}} {...props} />, store);
};

describe('GasDetailsItem', () => {
  it('should render label', () => {
    render();
    expect(screen.queryByText('Gas')).toBeInTheDocument();
    expect(screen.queryByText('(estimated)')).toBeInTheDocument();
    expect(screen.queryByText('Max fee:')).toBeInTheDocument();
    expect(screen.queryByText('ETH')).toBeInTheDocument();
  });
});
