import React from 'react';
import { fireEvent } from '@testing-library/react';
import { useNavigate } from 'react-router-dom-v5-compat';
import { renderWithProvider } from '../../../../test/lib/render-helpers';

import { useNetworkConnectionBanner } from '../../../hooks/useNetworkConnectionBanner';
import { setEditedNetwork } from '../../../store/actions';
import configureStore from '../../../store/store';
import { NetworkConnectionBanner } from './network-connection-banner';

jest.mock('../../../store/actions', () => ({
  updateNetworkConnectionBanner: jest.fn(() => ({
    type: 'UPDATE_NETWORK_CONNECTION_BANNER',
  })),
  setEditedNetwork: jest.fn(() => ({
    type: 'SET_EDIT_NETWORK',
  })),
}));

jest.mock('../../../hooks/useNetworkConnectionBanner', () => ({
  useNetworkConnectionBanner: jest.fn(),
}));

jest.mock('react-router-dom-v5-compat', () => ({
  useNavigate: jest.fn(),
}));

jest.mock('../../../hooks/useTheme', () => ({
  useTheme: () => 'light',
}));

const mockUseNetworkConnectionBanner = jest.mocked(useNetworkConnectionBanner);
const mockUseNavigate = jest.mocked(useNavigate);
const mockSetEditedNetwork = jest.mocked(setEditedNetwork);

describe('NetworkConnectionBanner', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseNavigate.mockReturnValue(jest.fn());
  });

  it('renders slow connection banner', () => {
    mockUseNetworkConnectionBanner.mockReturnValue({
      status: 'slow',
      networkName: 'Test Network',
      networkClientId: 'test-client-id',
      chainId: '0x1',
      trackNetworkBannerEvent: jest.fn(),
    });

    const store = configureStore({});

    const { getByText, getByTestId } = renderWithProvider(
      <NetworkConnectionBanner />,
      store,
    );

    expect(getByTestId('spinner')).toBeInTheDocument();
    expect(
      getByText('Still connecting to Test Network...'),
    ).toBeInTheDocument();
    expect(getByText('Update RPC')).toBeInTheDocument();
  });

  it('dispatches setEditedNetwork and navigates when Update RPC is clicked within slow banner', () => {
    const navigateMock = jest.fn();
    mockUseNavigate.mockReturnValue(navigateMock);

    // Mock the hook to return a slow connection banner state
    mockUseNetworkConnectionBanner.mockReturnValue({
      status: 'slow',
      networkName: 'Test Network',
      networkClientId: 'test-client-id',
      chainId: '0x1',
      trackNetworkBannerEvent: jest.fn(),
    });

    const store = configureStore({});

    const { getByText } = renderWithProvider(
      <NetworkConnectionBanner />,
      store,
    );

    fireEvent.click(getByText('Update RPC'));

    expect(mockSetEditedNetwork).toHaveBeenCalledWith({ chainId: '0x1' });
    expect(navigateMock).toHaveBeenCalledWith('/settings/networks');
  });

  it('renders unavailable connection banner', () => {
    mockUseNetworkConnectionBanner.mockReturnValue({
      status: 'unavailable',
      networkName: 'Test Network',
      networkClientId: 'test-client-id',
      chainId: '0x1',
      trackNetworkBannerEvent: jest.fn(),
    });

    const store = configureStore({});

    const { getByText, getByTestId } = renderWithProvider(
      <NetworkConnectionBanner />,
      store,
    );

    expect(getByTestId('icon')).toBeInTheDocument();
    expect(getByText('Unable to connect to Test Network')).toBeInTheDocument();
    expect(getByText('Update RPC')).toBeInTheDocument();
  });

  it('dispatches setEditedNetwork and navigates when Update RPC is clicked within unavailable banner', () => {
    const navigateMock = jest.fn();
    mockUseNavigate.mockReturnValue(navigateMock);

    mockUseNetworkConnectionBanner.mockReturnValue({
      status: 'unavailable',
      networkName: 'Test Network',
      networkClientId: 'test-client-id',
      chainId: '0x89',
      trackNetworkBannerEvent: jest.fn(),
    });

    const store = configureStore({});

    const { getByText } = renderWithProvider(
      <NetworkConnectionBanner />,
      store,
    );

    fireEvent.click(getByText('Update RPC'));

    expect(mockSetEditedNetwork).toHaveBeenCalledWith({ chainId: '0x89' });
    expect(navigateMock).toHaveBeenCalledWith('/settings/networks');
  });

  it('does not render banner when status is unknown', () => {
    mockUseNetworkConnectionBanner.mockReturnValue({
      status: 'unknown',
      trackNetworkBannerEvent: jest.fn(),
    });

    const store = configureStore({});

    const { container } = renderWithProvider(
      <NetworkConnectionBanner />,
      store,
    );

    expect(container.firstChild).toBeNull();
  });

  it('does not render banner when status is available', () => {
    mockUseNetworkConnectionBanner.mockReturnValue({
      status: 'available',
      networkName: 'Test Network',
      networkClientId: 'test-client-id',
      chainId: '0x1',
      trackNetworkBannerEvent: jest.fn(),
    });

    const store = configureStore({});

    const { container } = renderWithProvider(
      <NetworkConnectionBanner />,
      store,
    );

    expect(container.firstChild).toBeNull();
  });
});
