import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/jest';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import ExperimentalTab from './experimental-tab.component';

const render = () => {
  const store = configureStore({
    metamask: {
      ...mockState.metamask,
    },
  });
  return renderWithProvider(<ExperimentalTab />, store);
};

describe('ExperimentalTab', () => {
  it('renders ExperimentalTab component and shows Enable enhanced gas fee UI text', () => {
    render();
    expect(screen.getByText('Enable enhanced gas fee UI')).toBeInTheDocument();
  });
});
