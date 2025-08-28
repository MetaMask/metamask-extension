import React from 'react';
import { fireEvent } from '@testing-library/dom';

import mockState from '../../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../../test/jest';
import configureStore from '../../../../../store/store';
import { Asset } from './asset';

const mockHistory = {
  goBack: jest.fn(),
  push: jest.fn(),
};

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useHistory: () => mockHistory,
}));

jest.mock('react-router-dom-v5-compat', () => ({
  ...jest.requireActual('react-router-dom-v5-compat'),
  useLocation: () => ({ pathname: '/send/asset' }),
  useSearchParams: jest
    .fn()
    .mockReturnValue([
      { get: () => null, toString: () => 'searchParams=dummy' },
    ]),
}));

const render = (args?: Record<string, unknown>) => {
  const store = configureStore(args ?? mockState);

  return renderWithProvider(<Asset />, store);
};

describe('Asset', () => {
  it('should render correctly', () => {
    const { getByText } = render();

    expect(getByText('asset')).toBeInTheDocument();
  });

  it('go to AmountRecipient page when continue button is clicked', () => {
    const { getByText } = render();

    fireEvent.click(getByText('Continue'));
    expect(mockHistory.push).toHaveBeenCalledWith(
      '/send/amount-recipient?searchParams=dummy',
    );
  });

  it('go to previous page when previous button is clicked', () => {
    const { getByText } = render();

    fireEvent.click(getByText('Previous'));
    expect(mockHistory.goBack).toHaveBeenCalled();
  });
});
