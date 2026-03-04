import { fireEvent, screen } from '@testing-library/react';
import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import mockState from '../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import Assets from './assets-tab';

const mockUseNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockUseNavigate,
  useLocation: () => ({ pathname: '/settings-v2/assets' }),
}));

describe('Assets Tab', () => {
  const mockStore = configureMockStore([thunk])(mockState);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  function toggleCheckbox(
    testId: string,
    initialState: boolean,
    skipRender = false,
    store = mockStore,
  ) {
    if (!skipRender) {
      renderWithProvider(<Assets />, store);
    }

    const checkbox = screen.getByTestId(testId);

    expect(checkbox).toHaveAttribute('value', initialState ? 'true' : 'false');

    fireEvent.click(checkbox);

    fireEvent.change(checkbox, {
      target: { value: !initialState },
    });

    expect(checkbox).toHaveAttribute('value', initialState ? 'false' : 'true');

    return true;
  }

  it('renders all setting items', () => {
    renderWithProvider(<Assets />, mockStore);

    expect(screen.getByText('Local currency')).toBeInTheDocument();
    expect(
      screen.getByText('Show native token as main balance'),
    ).toBeInTheDocument();
    expect(screen.getByText('Hide tokens without balance')).toBeInTheDocument();
    expect(screen.getByText('Display NFT media')).toBeInTheDocument();
    expect(screen.getByText('Autodetect NFTs')).toBeInTheDocument();
    expect(screen.getByText('Autodetect tokens')).toBeInTheDocument();
  });

  it('matches snapshot', () => {
    const { container } = renderWithProvider(<Assets />, mockStore);

    expect(container).toMatchSnapshot();
  });

  it('toggles show native token as main balance', () => {
    // mockState.metamask.preferences.showNativeTokenAsMainBalance = true
    expect(toggleCheckbox('show-native-token-as-main-balance', true)).toBe(
      true,
    );
  });

  it('toggles hide zero balance tokens', () => {
    // mockState.metamask.preferences.hideZeroBalanceTokens = false
    expect(toggleCheckbox('toggle-zero-balance-button', false)).toBe(true);
  });

  it('toggles display NFT media', () => {
    // mockState.metamask.openSeaEnabled = true
    expect(toggleCheckbox('display-nft-media', true)).toBe(true);
  });

  it('toggles NFT detection', () => {
    // mockState.metamask.useNftDetection = true
    expect(toggleCheckbox('use-nft-detection', true)).toBe(true);
  });

  it('toggles NFT detection from disabled state', () => {
    const modifiedState = {
      ...mockState,
      metamask: {
        ...mockState.metamask,
        openSeaEnabled: false,
        useNftDetection: false,
      },
    };
    const localMockStore = configureMockStore([thunk])(modifiedState);
    renderWithProvider(<Assets />, localMockStore);

    expect(toggleCheckbox('use-nft-detection', false, true)).toBe(true);
  });

  it('toggles token detection', () => {
    // mockState.metamask.useTokenDetection = true
    expect(toggleCheckbox('autodetect-tokens', true)).toBe(true);
  });

  it('navigates to currency page when clicking local currency', () => {
    renderWithProvider(<Assets />, mockStore);

    const currencyButton = screen.getByRole('button', {
      name: 'Local currency',
    });
    fireEvent.click(currencyButton);

    expect(mockUseNavigate).toHaveBeenCalledWith('/settings-v2/assets/currency');
  });
});
