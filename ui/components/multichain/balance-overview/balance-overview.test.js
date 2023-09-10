import React from 'react';
import configureStore from '../../../store/store';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import mockState from '../../../../test/data/mock-state.json';
import { BalanceOverview } from '.';

const render = () => {
  const store = configureStore({
    metamask: {
      ...mockState.metamask,
    },
  });
  return renderWithProvider(<BalanceOverview />, store);
};

describe('Balance Overview and Portfolio for Tokens', () => {
  it('should match snapshot', () => {
    const { container } = render();
    expect(container).toMatchSnapshot();
  });
});
