import React from 'react';
import configureStore from 'redux-mock-store';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import mockState from '../../../../test/data/mock-state.json';
import NftDefaultImage from '.';

describe('NFT Default Image', () => {
  const mockShowIpfsModal = jest.fn();
  jest.mock('../../../store/actions.ts', () => ({
    showIpfsModal: () => mockShowIpfsModal,
  }));

  const store = configureStore()(mockState);

  it('should render with no props', () => {
    const { container } = renderWithProvider(<NftDefaultImage />, store);

    expect(container).toMatchSnapshot();
  });

  it('should match snapshot with all provided props', () => {
    const props = {
      name: 'NFT Name',
      tokenId: '123',
      clickable: false,
    };

    const { container } = renderWithProvider(
      <NftDefaultImage {...props} />,
      store,
    );

    expect(container).toMatchSnapshot();
  });

  it('should match snapshot with missing clickable prop', () => {
    const props = {
      name: 'NFT Name',
      tokenId: '123',
    };

    const { container } = renderWithProvider(
      <NftDefaultImage {...props} />,
      store,
    );

    expect(container).toMatchSnapshot();
  });

  it('should render NFT name', () => {
    const props = {
      name: 'NFT Name',
    };

    const { queryByText } = renderWithProvider(
      <NftDefaultImage {...props} />,
      store,
    );
    const nftElement = queryByText(`${props.name} #`);

    expect(nftElement).toBeInTheDocument();
  });

  it('should render NFT name and tokenId', () => {
    const props = {
      name: 'NFT Name',
      tokenId: '123',
    };

    const { queryByText } = renderWithProvider(
      <NftDefaultImage {...props} />,
      store,
    );
    const nftElement = queryByText(`${props.name} #${props.tokenId}`);

    expect(nftElement).toBeInTheDocument();
  });

  it('does not render component with clickable class when clickable is false', () => {
    const { container } = renderWithProvider(
      <NftDefaultImage name="NFT Name" tokenId="123" clickable={false} />,
      store,
    );
    expect(container.firstChild).not.toHaveClass('nft-default--clickable');
  });

  it('renders component with clickable class when clickable is true', () => {
    const { container } = renderWithProvider(
      <NftDefaultImage name="NFT Name" tokenId="123" clickable />,
      store,
    );
    expect(container.firstChild).toHaveClass('nft-default--clickable');
  });
});
