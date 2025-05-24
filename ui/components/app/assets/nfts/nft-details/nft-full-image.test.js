import { waitFor } from '@testing-library/react';
import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { toHex } from '@metamask/controller-utils';
import { useSelector } from 'react-redux';
import { CHAIN_IDS } from '@metamask/transaction-controller';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers';
import mockState from '../../../../../../test/data/mock-state.json';
import * as UseGetAssetImageUrlModule from '../../../../../hooks/useGetAssetImageUrl';
import { getNetworkConfigurationsByChainId } from '../../../../../../shared/modules/selectors/networks';
import { mockNetworkState } from '../../../../../../test/stub/networks';
import { getAllNfts } from '../../../../../ducks/metamask/metamask';
import { getIpfsGateway, getOpenSeaEnabled } from '../../../../../selectors';
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

jest.mock('react-redux', () => {
  const actual = jest.requireActual('react-redux');
  return {
    ...actual,
    useSelector: jest.fn(),
  };
});

describe('NFT full image', () => {
  const mockStore = configureMockStore([thunk])(mockState);

  useSelector.mockImplementation((selector) => {
    if (selector === getAllNfts) {
      return { ...mockState.metamask.allNfts[selectedAddress], chainId: 5 };
    }
    if (selector === getIpfsGateway) {
      return 'dweb.link';
    }
    if (selector === getOpenSeaEnabled) {
      return true;
    }
    if (selector === getNetworkConfigurationsByChainId) {
      return mockNetworkState(
        { chainId: CHAIN_IDS.MAINNET },
        { chainId: CHAIN_IDS.GOERLI },
      );
    }
    return undefined;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should match snapshot', async () => {
    const { container } = renderWithProvider(<NftFullImage />, mockStore);

    await waitFor(() => {
      expect(container).toMatchSnapshot();
    });
  });

  it('should show the first image if an NFT has an array of images', async () => {
    const images = [
      'ipfs://bafybeidgklvljyifilhtrxzh77brgnhcy6s2wxoxqc2l73zr2nxlwuxfcy',
      'ipfs://bafybeic26kitpujb3q5h5w7yovmvgmtxl3y4ldsb2pfgual5jq62emsmxq',
    ];
    const mockImageUrl =
      'https://bafybeidgklvljyifilhtrxzh77brgnhcy6s2wxoxqc2l73zr2nxlwuxfcy.ipfs.dweb.link';
    const mockUseGetAssetImageUrl = jest
      .spyOn(UseGetAssetImageUrlModule, 'default')
      .mockReturnValue(mockImageUrl);

    nfts[0].image = images;

    const { findByTestId } = renderWithProvider(<NftFullImage />, mockStore);

    const imageElem = await findByTestId('nft-image');
    expect(imageElem).toHaveAttribute('src', mockImageUrl);
    expect(mockUseGetAssetImageUrl).toHaveBeenCalledWith(
      images[0],
      expect.any(String),
    );
  });
});
