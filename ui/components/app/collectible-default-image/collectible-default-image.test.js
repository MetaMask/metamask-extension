import React from 'react';
import { fireEvent } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import CollectibleDefaultImage from '.';

describe('Collectible Default Image', () => {
  it('should render with no props', () => {
    const { container } = renderWithProvider(<CollectibleDefaultImage />);

    expect(container).toMatchSnapshot();
  });

  it('should match snapshot with all provided props', () => {
    const props = {
      name: 'Collectible Name',
      tokenId: '123',
      handleImageClick: jest.fn(),
    };

    const { container } = renderWithProvider(
      <CollectibleDefaultImage {...props} />,
    );

    expect(container).toMatchSnapshot();
  });

  it('should match snapshot with missing image click handler', () => {
    const props = {
      name: 'Collectible Name',
      tokenId: '123',
    };

    const { container } = renderWithProvider(
      <CollectibleDefaultImage {...props} />,
    );

    expect(container).toMatchSnapshot();
  });

  it('should render collectible name', () => {
    const props = {
      name: 'Collectible Name',
    };

    const { queryByText } = renderWithProvider(
      <CollectibleDefaultImage {...props} />,
    );

    const collectibleElement = queryByText(`${props.name} #`);

    expect(collectibleElement).toBeInTheDocument();
  });

  it('should render collectible name and tokenId', () => {
    const props = {
      name: 'Collectible Name',
      tokenId: '123',
    };

    const { queryByText } = renderWithProvider(
      <CollectibleDefaultImage {...props} />,
    );

    const collectibleElement = queryByText(`${props.name} #${props.tokenId}`);

    expect(collectibleElement).toBeInTheDocument();
  });

  it('should handle image click', () => {
    const props = {
      handleImageClick: jest.fn(),
    };

    const { queryByTestId } = renderWithProvider(
      <CollectibleDefaultImage {...props} />,
    );

    const collectibleImageElement = queryByTestId('collectible-default-image');
    fireEvent.click(collectibleImageElement);

    expect(props.handleImageClick).toHaveBeenCalled();
  });
});
