import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers';
import mockState from '../../../../../../test/data/mock-state.json';
import { NftEmptyState } from './nft-empty-state';

// Mock the portfolio utility
jest.mock('../../../../../helpers/utils/portfolio', () => ({
  getPortfolioUrl: jest.fn(
    () => 'https://portfolio.metamask.io/explore/nfts?test=params',
  ),
}));

// Mock global platform
const mockOpenTab = jest.fn();

// @ts-expect-error mocking platform
global.platform = {
  openTab: mockOpenTab,
};

describe('NftEmptyState', () => {
  const mockStore = configureMockStore([]);

  const renderComponent = (props = {}) => {
    const store = mockStore(mockState);
    return renderWithProvider(<NftEmptyState {...props} />, store);
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
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

    it('should render discover button', () => {
      renderComponent();
      expect(
        screen.getByRole('button', { name: 'Discover NFTs' }),
      ).toBeInTheDocument();
    });

    it('should apply custom className when provided', () => {
      const customClassName = 'custom-test-class';
      renderComponent({ className: customClassName });

      const emptyState = screen.getByTestId('nft-tab-empty-state');
      expect(emptyState).toHaveClass(customClassName);
    });
  });

  describe('User Interactions', () => {
    it('should call openTab when discover button is clicked', () => {
      renderComponent();

      const discoverButton = screen.getByRole('button', {
        name: 'Discover NFTs',
      });
      fireEvent.click(discoverButton);

      expect(mockOpenTab).toHaveBeenCalledTimes(1);
      expect(mockOpenTab).toHaveBeenCalledWith({
        url: 'https://portfolio.metamask.io/explore/nfts?test=params',
      });
    });
  });
});
