import { fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import CollectibleOptions from './nft-options';

describe('Collectible Options Component', () => {
  const props = {
    onRemove: jest.fn(),
    onViewOnOpensea: jest.fn(),
  };

  it('should expand collectible options menu`', async () => {
    const { queryByTestId } = renderWithProvider(
      <CollectibleOptions {...props} />,
    );

    const openOptionMenuButton = queryByTestId('collectible-options__button');

    expect(queryByTestId('collectible-item-remove')).not.toBeInTheDocument();

    fireEvent.click(openOptionMenuButton);

    await waitFor(() => {
      expect(queryByTestId('collectible-item-remove')).toBeInTheDocument();
    });
  });

  it('should expand and close menu options when clicked`', async () => {
    const { queryByTestId } = renderWithProvider(
      <CollectibleOptions {...props} />,
    );

    const openOptionMenuButton = queryByTestId('collectible-options__button');

    fireEvent.click(openOptionMenuButton);

    const closeOptionMenuButton = queryByTestId(
      'close-collectible-options-menu',
    );

    fireEvent.click(closeOptionMenuButton);

    expect(closeOptionMenuButton).not.toBeInTheDocument();
  });

  it('should click onRemove handler and close option menu', () => {
    const { queryByTestId } = renderWithProvider(
      <CollectibleOptions {...props} />,
    );

    const openOptionMenuButton = queryByTestId('collectible-options__button');

    fireEvent.click(openOptionMenuButton);

    const removeCollectibleButton = queryByTestId('collectible-item-remove');

    fireEvent.click(removeCollectibleButton);

    expect(props.onRemove).toHaveBeenCalled();
    expect(removeCollectibleButton).not.toBeInTheDocument();
  });

  it('should click onViewOnOpensea handler and close option menu', () => {
    const { queryByTestId } = renderWithProvider(
      <CollectibleOptions {...props} />,
    );

    const openOptionMenuButton = queryByTestId('collectible-options__button');
    const removeCollectibleButton = queryByTestId('collectible-item-remove');

    fireEvent.click(openOptionMenuButton);

    const openOpenSea = queryByTestId('collectible-options__view-on-opensea');

    fireEvent.click(openOpenSea);

    expect(props.onViewOnOpensea).toHaveBeenCalled();
    expect(removeCollectibleButton).not.toBeInTheDocument();
  });
});
