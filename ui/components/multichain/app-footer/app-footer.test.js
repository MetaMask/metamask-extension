import React from 'react';
import configureStore from '../../../store/store';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import mockState from '../../../../test/data/mock-state.json';
import { AppFooter } from '.';

const render = (stateChanges = {}, location = {}) => {
  const store = configureStore({
    ...mockState,
    activeTab: {
      origin: 'https://remix.ethereum.org',
    },
    ...stateChanges,
  });
  return renderWithProvider(<AppFooter location={location} />, store);
};

describe('App Footer', () => {
  it('should match snapshot', () => {
    const { container } = render();
    expect(container).toMatchSnapshot();
  });
});
