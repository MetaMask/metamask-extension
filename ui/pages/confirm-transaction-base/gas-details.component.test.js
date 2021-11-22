import React from 'react';
import configureMockStore from 'redux-mock-store';
import { screen } from '@testing-library/react';
import { useSelector } from 'react-redux';

import { ETH } from '../../helpers/constants/common';
import { getPreferences, getNativeCurrency } from '../../selectors';
import { renderWithProvider } from '../../../test/jest';

import GasDetails from './gas-details.component';

jest.mock('react-redux', () => {
  const actual = jest.requireActual('react-redux');

  return {
    ...actual,
    useSelector: jest.fn(),
  };
});

const render = (props) => {
  const store = configureMockStore([])({ metamask: { identities: [] } });

  return renderWithProvider(<GasDetails txData={{}} {...props} />, store);
};

describe('GasDetailsItem', () => {
  beforeEach(() => {
    useSelector.mockImplementation((selector) => {
      if (selector === getNativeCurrency) {
        return ETH;
      }
      if (selector === getPreferences) {
        return {
          useNativeCurrencyAsPrimaryCurrency: true,
        };
      }
      return undefined;
    });
  });
  it('should should render label', () => {
    render();
    expect(screen.queryByText('Gas')).toBeInTheDocument();
    expect(screen.queryByText('(estimated)')).toBeInTheDocument();
    expect(screen.queryByText('Max fee:')).toBeInTheDocument();
  });

  it('should should render gas fee details', () => {
    render({
      hexMinimumTransactionFee: '0x1ca62a4f7800',
      hexMaximumTransactionFee: '0x290ee75e3d900',
    });
    expect(screen.queryAllByText('0.000031')).toHaveLength(2);
    expect(screen.queryByText('ETH')).toBeInTheDocument();
    expect(screen.queryByText('0.000722')).toBeInTheDocument();
  });
});
