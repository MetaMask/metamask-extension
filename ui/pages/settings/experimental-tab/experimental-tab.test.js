import React from 'react';
import { renderWithProvider } from '../../../../test/jest';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import ExperimentalTab from './experimental-tab.component';

const render = (overrideMetaMaskState) => {
  const store = configureStore({
    metamask: {
      ...mockState.metamask,
      ...overrideMetaMaskState,
    },
  });
  return renderWithProvider(<ExperimentalTab />, store);
};

describe('ExperimentalTab', () => {
  it('renders ExperimentalTab component without error', () => {
    expect(() => {
      render();
    }).not.toThrow();
  });

  describe('with desktop enabled', () => {
    it('renders ExperimentalTab component without error', () => {
      const { container } = render({ desktopEnabled: true });
      expect(container).toMatchSnapshot();
    });
  });
});
