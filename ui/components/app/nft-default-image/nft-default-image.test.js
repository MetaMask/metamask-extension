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
      clickable: false,
    };

    const { container } = renderWithProvider(
      <NftDefaultImage {...props} />,
      store,
    );

    expect(container).toMatchSnapshot();
  });

  it('should match snapshot with missing clickable prop', () => {
    const { container } = renderWithProvider(<NftDefaultImage />, store);

    expect(container).toMatchSnapshot();
  });

  it('does not render component with clickable class when clickable is false', () => {
    const { container } = renderWithProvider(
      <NftDefaultImage clickable={false} />,
      store,
    );
    expect(container.firstChild).not.toHaveClass('nft-default--clickable');
  });

  it('renders component with clickable class when clickable is true', () => {
    const { container } = renderWithProvider(
      <NftDefaultImage clickable />,
      store,
    );
    expect(container.firstChild).toHaveClass('nft-default--clickable');
  });
});
