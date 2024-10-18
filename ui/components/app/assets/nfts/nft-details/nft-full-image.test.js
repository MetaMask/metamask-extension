import { waitFor } from '@testing-library/react';
import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { toHex } from '@metamask/controller-utils';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers';
import mockState from '../../../../../../test/data/mock-state.json';
import NftFullImage from './nft-full-image';

const selectedAddress =
  mockState.metamask.internalAccounts.accounts[
    mockState.metamask.internalAccounts.selectedAccount
  ].address;
const nfts = mockState.metamask.allNfts[selectedAddress][toHex(5)];
const mockAsset = nfts[0].address;
const mockId = nfts[0].tokenId;
jest.mock('react-router-dom', () => {
  const original = jest.requireActual('react-router-dom');
  return {
    ...original,
    useHistory: () => ({
      push: jest.fn(),
    }),
    useParams: () => ({
      asset: mockAsset,
      id: mockId,
    }),
  };
});

describe('NFT full image', () => {
  const mockStore = configureMockStore([thunk])(mockState);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should match snapshot', async () => {
    const { container } = renderWithProvider(<NftFullImage />, mockStore);

    await waitFor(() => {
      expect(container).toMatchSnapshot();
    });
  });
});
