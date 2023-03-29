import React from 'react';
import configureMockStore from 'redux-mock-store';
import mockState from '../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import NftInfoSetApprovalForAll from './nft-info-setApprovalForAll';

describe('NftInfoSetApprovalForAll', () => {
  const store = configureMockStore()(mockState);
  let props = {};

  beforeEach(() => {
    props = {
      assetName: 'Bored Ape Yatch Club',
      tokenAddress: '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D',
      total: 4,
      isERC721: true,
    };
  });

  it('should render NftInfoSetApprovalForAll component header title for collection name', () => {
    const { queryByText } = renderWithProvider(
      <NftInfoSetApprovalForAll {...props} />,
      store,
    );

    expect(queryByText('Name of collection:')).toBeInTheDocument();
  });

  it('should render NftInfoSetApprovalForAll component collection name when name of collection are implemented in NFTs smart contracts', () => {
    const { queryByText } = renderWithProvider(
      <NftInfoSetApprovalForAll {...props} />,
      store,
    );

    expect(queryByText('Bored Ape Yatch Club')).toBeInTheDocument();
  });

  it('should render NftInfoSetApprovalForAll component collection name when name of collection are not implemented in NFTs smart contracts', () => {
    props.assetName = undefined;
    const { queryByText } = renderWithProvider(
      <NftInfoSetApprovalForAll {...props} />,
      store,
    );

    expect(queryByText('Unnamed collection')).toBeInTheDocument();
  });

  it('should render NftInfoSetApprovalForAll component number of nfts title', () => {
    const { queryByText } = renderWithProvider(
      <NftInfoSetApprovalForAll {...props} />,
      store,
    );

    expect(queryByText('No. of NFTs:')).toBeInTheDocument();
  });

  it('should render NftInfoSetApprovalForAll component tooltip icon', () => {
    const { container } = renderWithProvider(
      <NftInfoSetApprovalForAll {...props} />,
      store,
    );

    const tooltipIcon = container.querySelector(
      '.nft-info-set-approve-for-all__tooltip__icon',
    );
    expect(tooltipIcon).toBeDefined();
  });

  it('should render NftInfoSetApprovalForAll component tooltip title text', () => {
    const { container } = renderWithProvider(
      <NftInfoSetApprovalForAll {...props} />,
      store,
    );

    const tooltipTitleText = container.querySelector(
      '.nft-info-set-approve-for-all__tooltip__title',
    );
    expect(tooltipTitleText).toBeDefined();
  });

  it('should render NftInfoSetApprovalForAll component tooltip text', () => {
    const { container } = renderWithProvider(
      <NftInfoSetApprovalForAll {...props} />,
      store,
    );

    const tooltipText = container.querySelector(
      '.nft-info-set-approve-for-all__tooltip',
    );
    expect(tooltipText).toBeDefined();
  });

  it('should render NftInfoSetApprovalForAll component number of nfts desctiption when asset standard is ERC721', () => {
    const { queryByText } = renderWithProvider(
      <NftInfoSetApprovalForAll {...props} />,
      store,
    );

    expect(queryByText('All (4) + Future NFTs')).toBeInTheDocument();
  });

  it('should render NftInfoSetApprovalForAll component number of nfts desctiption when asset standard is ERC1155', () => {
    props.isERC721 = false;
    const { queryByText } = renderWithProvider(
      <NftInfoSetApprovalForAll {...props} />,
      store,
    );

    expect(queryByText('All + Future NFTs')).toBeInTheDocument();
  });
});
