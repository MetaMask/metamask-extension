import React from 'react';
import { fireEvent } from '@testing-library/react';
import { useNavigate } from 'react-router-dom-v5-compat';
import { renderWithProvider } from '../../../../test/lib/render-helpers';

import { useNetworkConnectionBanner } from '../../../hooks/useNetworkConnectionBanner';
import { setEditedNetwork } from '../../../store/actions';
import configureStore from '../../../store/store';
import { MetaMetricsEventName } from '../../../../shared/constants/metametrics';
import { NetworkConnectionBanner } from './network-connection-banner';

jest.mock('../../../store/actions', () => ({
  updateNetworkConnectionBanner: jest.fn(() => ({
    type: 'UPDATE_NETWORK_CONNECTION_BANNER',
  })),
  setEditedNetwork: jest.fn(() => ({
    type: 'SET_EDITED_NETWORK',
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

  describe('when the status of the banner is "degraded"', () => {
    it('renders the banner with a "Still connecting" message, including a "Update RPC" link if the network is not an Infura endpoint', () => {
      mockUseNetworkConnectionBanner.mockReturnValue({
        status: 'degraded',
        networkName: 'Ethereum Mainnet',
        networkClientId: 'mainnet',
        chainId: '0x1',
        isInfuraEndpoint: false,
        trackNetworkBannerEvent: jest.fn(),
      });
      const store = configureStore({});

      const { getByText } = renderWithProvider(
        <NetworkConnectionBanner />,
        store,
      );

      expect(
        getByText('Still connecting to Ethereum Mainnet...'),
      ).toBeInTheDocument();
      expect(getByText('Update RPC')).toBeInTheDocument();
    });

    it('renders the banner with a "Still connecting" message, excluding a "Update RPC" link if the network is an Infura endpoint', () => {
      mockUseNetworkConnectionBanner.mockReturnValue({
        status: 'degraded',
        networkName: 'Ethereum Mainnet',
        networkClientId: 'mainnet',
        chainId: '0x1',
        isInfuraEndpoint: true,
        trackNetworkBannerEvent: jest.fn(),
      });
      const store = configureStore({});

      const { getByText, queryByText } = renderWithProvider(
        <NetworkConnectionBanner />,
        store,
      );

      expect(
        getByText('Still connecting to Ethereum Mainnet...'),
      ).toBeInTheDocument();
      expect(queryByText('Update RPC')).not.toBeInTheDocument();
    });

    describe('when the "Update RPC" link is clicked', () => {
      it('navigates to the edit form for the degraded network', () => {
        mockUseNetworkConnectionBanner.mockReturnValue({
          status: 'degraded',
          networkName: 'Ethereum Mainnet',
          networkClientId: 'mainnet',
          chainId: '0x1',
          isInfuraEndpoint: false,
          trackNetworkBannerEvent: jest.fn(),
        });
        const store = configureStore({});
        const navigateMock = jest.fn();
        mockUseNavigate.mockReturnValue(navigateMock);

        const { getByText } = renderWithProvider(
          <NetworkConnectionBanner />,
          store,
        );
        fireEvent.click(getByText('Update RPC'));

        expect(mockSetEditedNetwork).toHaveBeenCalledWith({
          chainId: '0x1',
          trackRpcUpdateFromBanner: true,
        });
        expect(navigateMock).toHaveBeenCalledWith('/settings/networks');
      });

      it('creates a metrics event', () => {
        const trackNetworkBannerEventMock = jest.fn();
        mockUseNetworkConnectionBanner.mockReturnValue({
          status: 'degraded',
          networkName: 'Ethereum Mainnet',
          networkClientId: 'mainnet',
          chainId: '0x1',
          isInfuraEndpoint: false,
          trackNetworkBannerEvent: trackNetworkBannerEventMock,
        });
        const store = configureStore({});

        const { getByText } = renderWithProvider(
          <NetworkConnectionBanner />,
          store,
        );
        fireEvent.click(getByText('Update RPC'));

        expect(trackNetworkBannerEventMock).toHaveBeenCalledWith({
          bannerType: 'degraded',
          eventName:
            MetaMetricsEventName.NetworkConnectionBannerUpdateRpcClicked,
          networkClientId: 'mainnet',
        });
      });
    });
  });

  describe('when the status of the banner is "unavailable"', () => {
    it('renders the banner with a "Unable to connect" message, including a "Update RPC" link if the network is not an Infura endpoint', () => {
      mockUseNetworkConnectionBanner.mockReturnValue({
        status: 'unavailable',
        networkName: 'Ethereum Mainnet',
        networkClientId: 'mainnet',
        chainId: '0x1',
        isInfuraEndpoint: false,
        trackNetworkBannerEvent: jest.fn(),
      });
      const store = configureStore({});

      const { getByText } = renderWithProvider(
        <NetworkConnectionBanner />,
        store,
      );

      expect(
        getByText('Unable to connect to Ethereum Mainnet.'),
      ).toBeInTheDocument();
      expect(
        getByText('Check network connectivity', { exact: false }),
      ).toBeInTheDocument();
      expect(
        getByText('update RPC', { selector: 'button' }),
      ).toBeInTheDocument();
    });

    it('renders the banner with a "Unable to connect" message, excluding a "Update RPC" link if the network is an Infura endpoint', () => {
      mockUseNetworkConnectionBanner.mockReturnValue({
        status: 'unavailable',
        networkName: 'Ethereum Mainnet',
        networkClientId: 'mainnet',
        chainId: '0x1',
        isInfuraEndpoint: true,
        trackNetworkBannerEvent: jest.fn(),
      });
      const store = configureStore({});

      const { getByText, queryByText } = renderWithProvider(
        <NetworkConnectionBanner />,
        store,
      );

      expect(
        getByText('Unable to connect to Ethereum Mainnet.'),
      ).toBeInTheDocument();
      expect(
        getByText('Check network connectivity', { exact: false }),
      ).toBeInTheDocument();
      expect(
        queryByText('update RPC', { selector: 'button' }),
      ).not.toBeInTheDocument();
    });

    describe('when the "Update RPC" link is clicked', () => {
      it('navigates to the edit form for the unavailable network', () => {
        mockUseNetworkConnectionBanner.mockReturnValue({
          status: 'unavailable',
          networkName: 'Ethereum Mainnet',
          networkClientId: 'mainnet',
          chainId: '0x1',
          isInfuraEndpoint: false,
          trackNetworkBannerEvent: jest.fn(),
        });
        const store = configureStore({});
        const navigateMock = jest.fn();
        mockUseNavigate.mockReturnValue(navigateMock);

        const { getByText } = renderWithProvider(
          <NetworkConnectionBanner />,
          store,
        );
        fireEvent.click(getByText('update RPC'));

        expect(mockSetEditedNetwork).toHaveBeenCalledWith({
          chainId: '0x1',
          trackRpcUpdateFromBanner: true,
        });
        expect(navigateMock).toHaveBeenCalledWith('/settings/networks');
      });

      it('creates a metrics event', () => {
        const trackNetworkBannerEventMock = jest.fn();
        mockUseNetworkConnectionBanner.mockReturnValue({
          status: 'unavailable',
          networkName: 'Ethereum Mainnet',
          networkClientId: 'mainnet',
          chainId: '0x1',
          isInfuraEndpoint: false,
          trackNetworkBannerEvent: trackNetworkBannerEventMock,
        });
        const store = configureStore({});

        const { getByText } = renderWithProvider(
          <NetworkConnectionBanner />,
          store,
        );
        fireEvent.click(getByText('update RPC'));

        expect(trackNetworkBannerEventMock).toHaveBeenCalledWith({
          bannerType: 'unavailable',
          eventName:
            MetaMetricsEventName.NetworkConnectionBannerUpdateRpcClicked,
          networkClientId: 'mainnet',
        });
      });
    });
  });

  describe('when the status of the banner is "unknown"', () => {
    it('does not render the banner', () => {
      mockUseNetworkConnectionBanner.mockReturnValue({
        status: 'unknown',
        trackNetworkBannerEvent: jest.fn(),
      });
      const store = configureStore({});

      const { container } = renderWithProvider(
        <NetworkConnectionBanner />,
        store,
      );

      expect(container.firstChild).not.toBeInTheDocument();
    });
  });

  describe('when the status of the banner is "available"', () => {
    it('does not render the banner', () => {
      mockUseNetworkConnectionBanner.mockReturnValue({
        status: 'available',
        trackNetworkBannerEvent: jest.fn(),
      });
      const store = configureStore({});

      const { container } = renderWithProvider(
        <NetworkConnectionBanner />,
        store,
      );

      expect(container.firstChild).not.toBeInTheDocument();
    });
  });
});
