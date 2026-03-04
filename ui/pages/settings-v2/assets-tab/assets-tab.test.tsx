import { fireEvent, screen } from '@testing-library/react';
import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import mockState from '../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { setBackgroundConnection } from '../../../store/background-connection';
import Assets from './assets-tab';

const mockSetShowNativeTokenAsMainBalancePreference = jest.fn();
const mockSetHideZeroBalanceTokens = jest.fn();
const mockSetOpenSeaEnabled = jest.fn();
const mockSetUseNftDetection = jest.fn();
const mockSetUseTokenDetection = jest.fn();

jest.mock('../../../store/actions', () => ({
  ...jest.requireActual('../../../store/actions'),
  setShowNativeTokenAsMainBalancePreference: (val: boolean) => {
    mockSetShowNativeTokenAsMainBalancePreference(val);
    return { type: 'MOCK_ACTION' };
  },
  setHideZeroBalanceTokens: (val: boolean) => {
    mockSetHideZeroBalanceTokens(val);
    return { type: 'MOCK_ACTION' };
  },
  setOpenSeaEnabled: (val: boolean) => {
    mockSetOpenSeaEnabled(val);
    return { type: 'MOCK_ACTION' };
  },
  setUseNftDetection: (val: boolean) => {
    mockSetUseNftDetection(val);
    return { type: 'MOCK_ACTION' };
  },
  setUseTokenDetection: (val: boolean) => {
    mockSetUseTokenDetection(val);
    return { type: 'MOCK_ACTION' };
  },
}));

const mockUseNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockUseNavigate,
  useLocation: () => ({ pathname: '/settings-v2/assets' }),
}));

// Mock background connection to prevent "Background connection not initialized" warnings
const backgroundConnectionMock = new Proxy(
  {},
  {
    get: () => jest.fn().mockResolvedValue(undefined),
  },
);

describe('Assets Tab', () => {
  const mockStore = configureMockStore([thunk])(mockState);

  beforeEach(() => {
    jest.clearAllMocks();
    setBackgroundConnection(backgroundConnectionMock as never);
  });

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

  it('calls setShowNativeTokenAsMainBalancePreference when toggling show native token', () => {
    renderWithProvider(<Assets />, mockStore);

    const toggle = screen.getByTestId('show-native-token-as-main-balance');
    fireEvent.click(toggle);

    // Initial state is true, so toggling should call with false
    expect(mockSetShowNativeTokenAsMainBalancePreference).toHaveBeenCalledWith(
      false,
    );
  });

  it('calls setHideZeroBalanceTokens when toggling hide zero balance', () => {
    renderWithProvider(<Assets />, mockStore);

    const toggle = screen.getByTestId('toggle-zero-balance-button');
    fireEvent.click(toggle);

    // Initial state is false, so toggling should call with true
    expect(mockSetHideZeroBalanceTokens).toHaveBeenCalledWith(true);
  });

  it('calls setOpenSeaEnabled when toggling display NFT media', () => {
    renderWithProvider(<Assets />, mockStore);

    const toggle = screen.getByTestId('display-nft-media');
    fireEvent.click(toggle);

    // Initial state is true, so toggling should call with false
    expect(mockSetOpenSeaEnabled).toHaveBeenCalledWith(false);
  });

  it('calls setUseNftDetection when toggling NFT detection', () => {
    renderWithProvider(<Assets />, mockStore);

    const toggle = screen.getByTestId('use-nft-detection');
    fireEvent.click(toggle);

    // Initial state is true, so toggling should call with false
    expect(mockSetUseNftDetection).toHaveBeenCalledWith(false);
  });

  it('enables openSea when enabling NFT detection while openSea is disabled', () => {
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

    const toggle = screen.getByTestId('use-nft-detection');
    fireEvent.click(toggle);

    // When enabling NFT detection while openSea is disabled, both should be enabled
    expect(mockSetOpenSeaEnabled).toHaveBeenCalledWith(true);
    expect(mockSetUseNftDetection).toHaveBeenCalledWith(true);
  });

  it('calls setUseTokenDetection when toggling token detection', () => {
    renderWithProvider(<Assets />, mockStore);

    const toggle = screen.getByTestId('autodetect-tokens');
    fireEvent.click(toggle);

    // Initial state is true, so toggling should call with false
    expect(mockSetUseTokenDetection).toHaveBeenCalledWith(false);
  });

  it('navigates to currency page when clicking local currency', () => {
    renderWithProvider(<Assets />, mockStore);

    const currencyButton = screen.getByRole('button', {
      name: 'Local currency',
    });
    fireEvent.click(currencyButton);

    expect(mockUseNavigate).toHaveBeenCalledWith(
      '/settings-v2/assets/currency',
    );
  });
});
