import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/jest';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import AssetList from './asset-list';

const render = (chainId) => {
  const store = configureStore({
    metamask: {
      ...mockState.metamask,
      providerConfig: { chainId },
    },
  });
  return renderWithProvider(<AssetList onClickAsset={jest.fn()} />, store);
};

describe('AssetList', () => {
  it('renders AssetList component and shows Refresh List text', () => {
    render('0x1');
    expect(screen.getByText('Refresh list')).toBeInTheDocument();
  });

  it('renders AssetList component and hides Refresh List on unsupported network', () => {
    const { queryByText } = render('0x99');
    expect(queryByText('Refresh list')).not.toBeInTheDocument();
  });
});
