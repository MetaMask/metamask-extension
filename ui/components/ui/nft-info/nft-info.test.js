import React from 'react';
import configureMockStore from 'redux-mock-store';
import mockState from '../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import NftInfo from './nft-info';

describe('NftInfo', () => {
  const store = configureMockStore()(mockState);
  let props = {};

  beforeEach(() => {
    props = {
      assetName: 'Bored Ape Yatch Club',
      tokenAddress: '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D',
      tokenId: '123',
    };
  });

  it('should render NftInfo component collection name when name of collection are implemented in NFTs smart contracts', () => {
    const { queryByText } = renderWithProvider(<NftInfo {...props} />, store);

    expect(queryByText('Bored Ape Yatch Club')).toBeInTheDocument();
  });

  it('should render NftInfo component collection name when name of collection are not implemented in NFTs smart contracts', () => {
    props.assetName = undefined;
    const { queryByText } = renderWithProvider(<NftInfo {...props} />, store);

    expect(queryByText('Unnamed collection')).toBeInTheDocument();
  });

  it('should render NftInfo component token id for specific collection', () => {
    const { queryByText } = renderWithProvider(<NftInfo {...props} />, store);

    expect(queryByText('Token ID #123')).toBeInTheDocument();
  });

  it('should render NftInfo component token id for specific collection when token id changes', () => {
    props.tokenId = '38';
    const { queryByText } = renderWithProvider(<NftInfo {...props} />, store);

    expect(queryByText('Token ID #38')).toBeInTheDocument();
  });
});
