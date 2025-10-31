import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import thunk from 'redux-thunk';
import configureMockStore from 'redux-mock-store';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers';
import mockState from '../../../../../../test/data/mock-state.json';
import { ThemeType } from '../../../../../../shared/constants/preferences';
import * as actions from '../../../../../store/actions';
import { NftEmptyState } from './nft-empty-state';

describe('NftEmptyState', () => {
  const mockStore = configureMockStore([thunk]);
  let store: ReturnType<typeof mockStore>;

  const renderComponent = (props = {}, stateOverride = {}) => {
    store = mockStore({ ...mockState, ...stateOverride });
    return renderWithProvider(<NftEmptyState {...props} />, store);
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the component with correct test id', () => {
    renderComponent();
    expect(screen.getByTestId('nft-tab-empty-state')).toBeInTheDocument();
  });

  it('should render description text', () => {
    renderComponent();
    expect(
      screen.getByText(
        "There's a world of NFTs out there. Start your collection today.",
      ),
    ).toBeInTheDocument();
  });

  it('should render import button', () => {
    renderComponent();
    expect(
      screen.getByRole('button', { name: 'Import NFT' }),
    ).toBeInTheDocument();
  });

  it('should apply custom className when provided', () => {
    const customClassName = 'custom-test-class';
    renderComponent({ className: customClassName });

    const emptyState = screen.getByTestId('nft-tab-empty-state');
    expect(emptyState).toHaveClass(customClassName);
  });

  it('should dispatch showImportNftsModal when import button is clicked', () => {
    const showImportNftsModalSpy = jest.spyOn(actions, 'showImportNftsModal');
    renderComponent();

    const importButton = screen.getByRole('button', {
      name: 'Import NFT',
    });
    fireEvent.click(importButton);

    expect(showImportNftsModalSpy).toHaveBeenCalledWith({});
  });

  it('should render light theme icon by default', () => {
    renderComponent();

    const image = screen.getByAltText('NFTs');
    expect(image).toHaveAttribute('src', './images/empty-state-nfts-light.png');
  });

  it('should render dark theme icon when theme is dark', () => {
    const darkThemeState = {
      metamask: {
        ...mockState.metamask,
        theme: ThemeType.dark,
      },
    };

    renderComponent({}, darkThemeState);

    const image = screen.getByAltText('NFTs');
    expect(image).toHaveAttribute('src', './images/empty-state-nfts-dark.png');
  });
});
