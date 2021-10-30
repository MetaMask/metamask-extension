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
  });

  it('should render gas fee details', () => {
    render({
      hexMinimumTransactionFee: '0x1ca62a4f7800',
      hexMaximumTransactionFee: '0x290ee75e3d900',
    });
    expect(screen.queryAllByText('0.000031')).toHaveLength(2);
    expect(screen.queryByText('ETH')).toBeInTheDocument();
    expect(screen.queryByText('0.000722')).toBeInTheDocument();
  });
});
