import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/jest';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import AssetList from './asset-list';

const render = () => {
  const store = configureStore({
    metamask: {
      ...mockState.metamask,
    },
  });
  return renderWithProvider(<AssetList />, store);
};

describe('AssetList', () => {
  it('renders AssetList component and shows Refresh List text', () => {
    render();
    expect(screen.getByText('Refresh list')).toBeInTheDocument();
  });
});
