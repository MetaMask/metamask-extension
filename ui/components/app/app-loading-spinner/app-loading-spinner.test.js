import React from 'react';
import { screen } from '@testing-library/react';

import { renderWithProvider } from '../../../../test/lib/render-helpers';
import configureStore from '../../../store/store';

import AppLoadingSpinner from './app-loading-spinner';

const render = (params) => {
  const store = configureStore({
    ...params,
  });

  return renderWithProvider(<AppLoadingSpinner />, store);
};

describe('AppLoadingSpinner', () => {
  it('should return null if app state is not loading', () => {
    render();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('should show spinner if app state is loading', () => {
    render({ appState: { isLoading: true } });
    expect(screen.queryByRole('alert')).toBeInTheDocument();
  });
});
