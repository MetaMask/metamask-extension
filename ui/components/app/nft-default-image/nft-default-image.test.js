import React from 'react';
import { fireEvent } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import NftDefaultImage from '.';

describe('NFT Default Image', () => {
  it('should render with no props', () => {
    const { container } = renderWithProvider(<NftDefaultImage />);

    expect(container).toMatchSnapshot();
  });

  it('should match snapshot with all provided props', () => {
    const props = {
      name: 'NFT Name',
      tokenId: '123',
      handleImageClick: jest.fn(),
    };

    const { container } = renderWithProvider(<NftDefaultImage {...props} />);

    expect(container).toMatchSnapshot();
  });

  it('should match snapshot with missing image click handler', () => {
    const props = {
      name: 'NFT Name',
      tokenId: '123',
    };

    const { container } = renderWithProvider(<NftDefaultImage {...props} />);

    expect(container).toMatchSnapshot();
  });

  it('should render NFT name', () => {
    const props = {
      name: 'NFT Name',
    };

    const { queryByText } = renderWithProvider(<NftDefaultImage {...props} />);

    const nftElement = queryByText(`${props.name} #`);

    expect(nftElement).toBeInTheDocument();
  });

  it('should render NFT name and tokenId', () => {
    const props = {
      name: 'NFT Name',
      tokenId: '123',
    };

    const { queryByText } = renderWithProvider(<NftDefaultImage {...props} />);

    const nftElement = queryByText(`${props.name} #${props.tokenId}`);

    expect(nftElement).toBeInTheDocument();
  });

  it('should handle image click', () => {
    const props = {
      handleImageClick: jest.fn(),
    };

    const { queryByTestId } = renderWithProvider(
      <NftDefaultImage {...props} />,
    );

    const nftImageElement = queryByTestId('nft-default-image');
    fireEvent.click(nftImageElement);

    expect(props.handleImageClick).toHaveBeenCalled();
  });
});
