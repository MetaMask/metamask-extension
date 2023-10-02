import React from 'react';
import configureStore from '../../../store/store';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import mockState from '../../../../test/data/mock-state.json';
import { BalanceOverview } from '.';

const render = () => {
  const store = configureStore(mockState);
  return renderWithProvider(
    <BalanceOverview balance="$1,209.02" loading={false} />,
    store,
  );
};

describe('Balance Overview and Portfolio for Tokens', () => {
  it('should match snapshot', () => {
    const { container } = render();
    expect(container).toMatchSnapshot();
  });
});
