import React from 'react';
import { useSelector } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { screen } from '@testing-library/react';
import mockState from '../../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers';
import { getIpfsGateway, getOpenSeaEnabled } from '../../../../../selectors';
import { CollectionImageComponent } from './collection-image.component';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn(),
}));

jest.mock('../../../../../selectors', () => ({
  ...jest.requireActual('../../../../../selectors'),
  getIpfsGateway: jest.fn(),
  getOpenSeaEnabled: jest.fn(),
}));
const mockStore = configureMockStore([thunk])(mockState);
describe('CollectionImageComponent', () => {
  const useSelectorMock = useSelector as jest.Mock;
  beforeEach(() => {
    jest.resetAllMocks();
  });
  it('should show collection first letter when ipfs is not enabled', async () => {
    useSelectorMock.mockImplementation((selector) => {
      if (selector === getIpfsGateway) {
        return undefined;
      }
      return undefined;
    });

    const props = {
      collectionName: 'NFT Collection',
      collectionImage: 'ipfs://',
    };

    const { getByText } = renderWithProvider(
      <CollectionImageComponent {...props} />,
      mockStore,
    );

    expect(getByText('N')).toBeInTheDocument();
  });

  it('should show collection first letter when opensea is not enabled', async () => {
    useSelectorMock.mockImplementation((selector) => {
      if (selector === getOpenSeaEnabled) {
        return false;
      }
      return undefined;
    });

    const props = {
      collectionName: 'Test NFT Collection',
      collectionImage: 'https://image.png',
    };

    const { getByText } = renderWithProvider(
      <CollectionImageComponent {...props} />,
      mockStore,
    );

    expect(getByText('T')).toBeInTheDocument();
  });

  it('should show collection image', async () => {
    useSelectorMock.mockImplementation((selector) => {
      if (selector === getOpenSeaEnabled) {
        return true;
      }
      return undefined;
    });

    const props = {
      collectionName: 'Test NFT Collection',
      collectionImage: 'https://image.png',
    };

    renderWithProvider(<CollectionImageComponent {...props} />, mockStore);

    expect(screen.getAllByRole('img')).toHaveLength(1);
  });
});
