import React from 'react';
import configureStore from '../../../store/store';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import mockState from '../../../../test/data/mock-state.json';
import { AppFooter } from '.';

const store = configureStore({
  ...mockState,
  activeTab: {
    origin: 'https://remix.ethereum.org',
  },
});

describe('App Footer', () => {
  it('should match snapshot', () => {
    const { container } = renderWithProvider(<AppFooter />, store);
    expect(container).toMatchSnapshot();
  });

  it('should render correctly', () => {
    const { queryByTestId } = renderWithProvider(<AppFooter />, store);

    expect(queryByTestId('app-footer')).toBeDefined();
  });
});
