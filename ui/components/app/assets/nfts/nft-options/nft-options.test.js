import { fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers';
import NftOptions from './nft-options';

describe('NFT Options Component', () => {
  const props = {
    onRemove: jest.fn(),
    onViewOnOpensea: jest.fn(),
    showOpenSeaLink: true,
  };

  it('should expand NFT options menu`', async () => {
    const { queryByTestId } = renderWithProvider(<NftOptions {...props} />);

    const openOptionMenuButton = queryByTestId('nft-options__button');

    expect(queryByTestId('nft-item-remove')).not.toBeInTheDocument();

    fireEvent.click(openOptionMenuButton);

    await waitFor(() => {
      expect(queryByTestId('nft-item-remove')).toBeInTheDocument();
    });
  });

  it('should expand and close menu options when clicked`', async () => {
    const { queryByTestId } = renderWithProvider(<NftOptions {...props} />);

    const optionMenuToggle = queryByTestId('nft-options__button');

    fireEvent.click(optionMenuToggle);
    fireEvent.click(optionMenuToggle);

    const nftItemRemove = queryByTestId('nft-item-remove');

    expect(nftItemRemove).not.toBeInTheDocument();
  });

  it('should click onRemove handler and close option menu', () => {
    const { queryByTestId } = renderWithProvider(<NftOptions {...props} />);

    const openOptionMenuButton = queryByTestId('nft-options__button');

    fireEvent.click(openOptionMenuButton);

    const removeNftButton = queryByTestId('nft-item-remove__button');
    fireEvent.click(removeNftButton);

    expect(props.onRemove).toHaveBeenCalled();
    expect(removeNftButton).not.toBeInTheDocument();
  });

  it('should click onViewOnOpensea handler and close option menu', () => {
    const { queryByTestId } = renderWithProvider(<NftOptions {...props} />);

    const openOptionMenuButton = queryByTestId('nft-options__button');
    const removeNftButton = queryByTestId('nft-item-remove');

    fireEvent.click(openOptionMenuButton);

    const openOpenSea = queryByTestId('nft-options__view-on-opensea__button');

    fireEvent.click(openOpenSea);
    expect(props.onViewOnOpensea).toHaveBeenCalled();
    expect(removeNftButton).not.toBeInTheDocument();
  });
});
