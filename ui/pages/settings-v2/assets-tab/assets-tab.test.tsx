import { fireEvent, screen } from '@testing-library/react';
import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import mockState from '../../../../test/data/mock-state.json';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { setBackgroundConnection } from '../../../store/background-connection';
import { CURRENCY_ROUTE } from '../../../helpers/constants/routes';
import Assets from './assets-tab';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

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

const backgroundConnectionMock = new Proxy(
  {},
  { get: () => jest.fn().mockResolvedValue(undefined) },
);

describe('Assets Tab', () => {
  const mockStore = configureMockStore([thunk])(mockState);

  beforeEach(() => {
    jest.clearAllMocks();
    setBackgroundConnection(backgroundConnectionMock as never);
  });

  describe('LocalCurrencyItem', () => {
    it('renders title', () => {
      renderWithProvider(<Assets />, mockStore);

      expect(
        screen.getByText(messages.localCurrency.message),
      ).toBeInTheDocument();
    });

    it('displays current currency in uppercase', () => {
      renderWithProvider(<Assets />, mockStore);

      expect(screen.getByText('USD')).toBeInTheDocument();
    });

    it('renders navigation button', () => {
      renderWithProvider(<Assets />, mockStore);

      const button = screen.getByRole('button', {
        name: messages.localCurrency.message,
      });
      expect(button).toBeInTheDocument();
    });

    it('navigates to currency page when clicked', () => {
      renderWithProvider(<Assets />, mockStore);

      const button = screen.getByRole('button', {
        name: messages.localCurrency.message,
      });
      fireEvent.click(button);

      expect(mockNavigate).toHaveBeenCalledWith(CURRENCY_ROUTE);
    });
  });

  describe('ShowNetworkTokenToggleItem', () => {
    it('renders title', () => {
      renderWithProvider(<Assets />, mockStore);

      expect(
        screen.getByText(messages.showNativeTokenAsMainBalance.message),
      ).toBeInTheDocument();
    });

    it('renders toggle in enabled state', () => {
      const storeEnabled = configureMockStore([thunk])({
        ...mockState,
        metamask: {
          ...mockState.metamask,
          preferences: {
            ...mockState.metamask.preferences,
            showNativeTokenAsMainBalance: true,
          },
        },
      });
      renderWithProvider(<Assets />, storeEnabled);

      expect(
        screen.getByTestId('show-native-token-as-main-balance'),
      ).toHaveAttribute('value', 'true');
    });

    it('renders toggle in disabled state', () => {
      const storeDisabled = configureMockStore([thunk])({
        ...mockState,
        metamask: {
          ...mockState.metamask,
          preferences: {
            ...mockState.metamask.preferences,
            showNativeTokenAsMainBalance: false,
          },
        },
      });
      renderWithProvider(<Assets />, storeDisabled);

      expect(
        screen.getByTestId('show-native-token-as-main-balance'),
      ).toHaveAttribute('value', 'false');
    });

    it('calls action with false when toggled off', () => {
      const storeEnabled = configureMockStore([thunk])({
        ...mockState,
        metamask: {
          ...mockState.metamask,
          preferences: {
            ...mockState.metamask.preferences,
            showNativeTokenAsMainBalance: true,
          },
        },
      });
      renderWithProvider(<Assets />, storeEnabled);

      fireEvent.click(screen.getByTestId('show-native-token-as-main-balance'));

      expect(
        mockSetShowNativeTokenAsMainBalancePreference,
      ).toHaveBeenCalledWith(false);
    });

    it('calls action with true when toggled on', () => {
      const storeDisabled = configureMockStore([thunk])({
        ...mockState,
        metamask: {
          ...mockState.metamask,
          preferences: {
            ...mockState.metamask.preferences,
            showNativeTokenAsMainBalance: false,
          },
        },
      });
      renderWithProvider(<Assets />, storeDisabled);

      fireEvent.click(screen.getByTestId('show-native-token-as-main-balance'));

      expect(
        mockSetShowNativeTokenAsMainBalancePreference,
      ).toHaveBeenCalledWith(true);
    });
  });

  describe('HideZeroBalanceTokensToggleItem', () => {
    it('renders title', () => {
      renderWithProvider(<Assets />, mockStore);

      expect(
        screen.getByText(messages.hideZeroBalanceTokens.message),
      ).toBeInTheDocument();
    });

    it('renders toggle in enabled state', () => {
      const storeEnabled = configureMockStore([thunk])({
        ...mockState,
        metamask: {
          ...mockState.metamask,
          preferences: {
            ...mockState.metamask.preferences,
            hideZeroBalanceTokens: true,
          },
        },
      });
      renderWithProvider(<Assets />, storeEnabled);

      expect(screen.getByTestId('toggle-zero-balance-button')).toHaveAttribute(
        'value',
        'true',
      );
    });

    it('renders toggle in disabled state', () => {
      const storeDisabled = configureMockStore([thunk])({
        ...mockState,
        metamask: {
          ...mockState.metamask,
          preferences: {
            ...mockState.metamask.preferences,
            hideZeroBalanceTokens: false,
          },
        },
      });
      renderWithProvider(<Assets />, storeDisabled);

      expect(screen.getByTestId('toggle-zero-balance-button')).toHaveAttribute(
        'value',
        'false',
      );
    });

    it('calls action with false when toggled off', () => {
      const storeEnabled = configureMockStore([thunk])({
        ...mockState,
        metamask: {
          ...mockState.metamask,
          preferences: {
            ...mockState.metamask.preferences,
            hideZeroBalanceTokens: true,
          },
        },
      });
      renderWithProvider(<Assets />, storeEnabled);

      fireEvent.click(screen.getByTestId('toggle-zero-balance-button'));

      expect(mockSetHideZeroBalanceTokens).toHaveBeenCalledWith(false);
    });

    it('calls action with true when toggled on', () => {
      const storeDisabled = configureMockStore([thunk])({
        ...mockState,
        metamask: {
          ...mockState.metamask,
          preferences: {
            ...mockState.metamask.preferences,
            hideZeroBalanceTokens: false,
          },
        },
      });
      renderWithProvider(<Assets />, storeDisabled);

      fireEvent.click(screen.getByTestId('toggle-zero-balance-button'));

      expect(mockSetHideZeroBalanceTokens).toHaveBeenCalledWith(true);
    });
  });

  describe('DisplayNftMediaToggleItem', () => {
    it('renders title', () => {
      renderWithProvider(<Assets />, mockStore);

      expect(
        screen.getByText(messages.displayNftMedia.message),
      ).toBeInTheDocument();
    });

    it('renders description', () => {
      renderWithProvider(<Assets />, mockStore);

      expect(
        screen.getByText(messages.displayNftMediaDescriptionV2.message),
      ).toBeInTheDocument();
    });

    it('renders toggle in enabled state', () => {
      const storeEnabled = configureMockStore([thunk])({
        ...mockState,
        metamask: { ...mockState.metamask, openSeaEnabled: true },
      });
      renderWithProvider(<Assets />, storeEnabled);

      expect(screen.getByTestId('display-nft-media')).toHaveAttribute(
        'value',
        'true',
      );
    });

    it('renders toggle in disabled state', () => {
      const storeDisabled = configureMockStore([thunk])({
        ...mockState,
        metamask: { ...mockState.metamask, openSeaEnabled: false },
      });
      renderWithProvider(<Assets />, storeDisabled);

      expect(screen.getByTestId('display-nft-media')).toHaveAttribute(
        'value',
        'false',
      );
    });

    it('calls action with false when toggled off', () => {
      const storeEnabled = configureMockStore([thunk])({
        ...mockState,
        metamask: { ...mockState.metamask, openSeaEnabled: true },
      });
      renderWithProvider(<Assets />, storeEnabled);

      fireEvent.click(screen.getByTestId('display-nft-media'));

      expect(mockSetOpenSeaEnabled).toHaveBeenCalledWith(false);
    });

    it('calls action with true when toggled on', () => {
      const storeDisabled = configureMockStore([thunk])({
        ...mockState,
        metamask: { ...mockState.metamask, openSeaEnabled: false },
      });
      renderWithProvider(<Assets />, storeDisabled);

      fireEvent.click(screen.getByTestId('display-nft-media'));

      expect(mockSetOpenSeaEnabled).toHaveBeenCalledWith(true);
    });

    it('disables NFT detection when disabling display while detection is on', () => {
      const storeWithBothEnabled = configureMockStore([thunk])({
        ...mockState,
        metamask: {
          ...mockState.metamask,
          openSeaEnabled: true,
          useNftDetection: true,
        },
      });
      renderWithProvider(<Assets />, storeWithBothEnabled);

      fireEvent.click(screen.getByTestId('display-nft-media'));

      expect(mockSetUseNftDetection).toHaveBeenCalledWith(false);
      expect(mockSetOpenSeaEnabled).toHaveBeenCalledWith(false);
    });
  });

  describe('AutodetectNftsToggleItem', () => {
    it('renders title', () => {
      renderWithProvider(<Assets />, mockStore);

      expect(
        screen.getByText(messages.useNftDetection.message),
      ).toBeInTheDocument();
    });

    it('renders description', () => {
      renderWithProvider(<Assets />, mockStore);

      expect(
        screen.getByText(messages.useNftDetectionDescription.message),
      ).toBeInTheDocument();
    });

    it('renders toggle in enabled state', () => {
      const storeEnabled = configureMockStore([thunk])({
        ...mockState,
        metamask: { ...mockState.metamask, useNftDetection: true },
      });
      renderWithProvider(<Assets />, storeEnabled);

      expect(screen.getByTestId('use-nft-detection')).toHaveAttribute(
        'value',
        'true',
      );
    });

    it('renders toggle in disabled state', () => {
      const storeDisabled = configureMockStore([thunk])({
        ...mockState,
        metamask: { ...mockState.metamask, useNftDetection: false },
      });
      renderWithProvider(<Assets />, storeDisabled);

      expect(screen.getByTestId('use-nft-detection')).toHaveAttribute(
        'value',
        'false',
      );
    });

    it('calls action with false when toggled off', () => {
      const storeEnabled = configureMockStore([thunk])({
        ...mockState,
        metamask: { ...mockState.metamask, useNftDetection: true },
      });
      renderWithProvider(<Assets />, storeEnabled);

      fireEvent.click(screen.getByTestId('use-nft-detection'));

      expect(mockSetUseNftDetection).toHaveBeenCalledWith(false);
    });

    it('calls action with true when toggled on', () => {
      const storeDisabled = configureMockStore([thunk])({
        ...mockState,
        metamask: { ...mockState.metamask, useNftDetection: false },
      });
      renderWithProvider(<Assets />, storeDisabled);

      fireEvent.click(screen.getByTestId('use-nft-detection'));

      expect(mockSetUseNftDetection).toHaveBeenCalledWith(true);
    });

    it('enables OpenSea when enabling detection while OpenSea is disabled', () => {
      const storeWithBothDisabled = configureMockStore([thunk])({
        ...mockState,
        metamask: {
          ...mockState.metamask,
          openSeaEnabled: false,
          useNftDetection: false,
        },
      });
      renderWithProvider(<Assets />, storeWithBothDisabled);

      fireEvent.click(screen.getByTestId('use-nft-detection'));

      expect(mockSetOpenSeaEnabled).toHaveBeenCalledWith(true);
      expect(mockSetUseNftDetection).toHaveBeenCalledWith(true);
    });

    it('does not enable OpenSea when enabling detection while OpenSea is already enabled', () => {
      const storeWithOpenSeaEnabled = configureMockStore([thunk])({
        ...mockState,
        metamask: {
          ...mockState.metamask,
          openSeaEnabled: true,
          useNftDetection: false,
        },
      });
      renderWithProvider(<Assets />, storeWithOpenSeaEnabled);

      fireEvent.click(screen.getByTestId('use-nft-detection'));

      expect(mockSetOpenSeaEnabled).not.toHaveBeenCalled();
      expect(mockSetUseNftDetection).toHaveBeenCalledWith(true);
    });
  });

  describe('AutodetectTokensToggleItem', () => {
    it('renders title', () => {
      renderWithProvider(<Assets />, mockStore);

      expect(
        screen.getByText(messages.autoDetectTokens.message),
      ).toBeInTheDocument();
    });

    it('renders description', () => {
      renderWithProvider(<Assets />, mockStore);

      expect(
        screen.getByText(messages.autoDetectTokensDescriptionV2.message),
      ).toBeInTheDocument();
    });

    it('renders toggle in enabled state', () => {
      const storeEnabled = configureMockStore([thunk])({
        ...mockState,
        metamask: { ...mockState.metamask, useTokenDetection: true },
      });
      renderWithProvider(<Assets />, storeEnabled);

      expect(screen.getByTestId('autodetect-tokens')).toHaveAttribute(
        'value',
        'true',
      );
    });

    it('renders toggle in disabled state', () => {
      const storeDisabled = configureMockStore([thunk])({
        ...mockState,
        metamask: { ...mockState.metamask, useTokenDetection: false },
      });
      renderWithProvider(<Assets />, storeDisabled);

      expect(screen.getByTestId('autodetect-tokens')).toHaveAttribute(
        'value',
        'false',
      );
    });

    it('calls action with false when toggled off', () => {
      const storeEnabled = configureMockStore([thunk])({
        ...mockState,
        metamask: { ...mockState.metamask, useTokenDetection: true },
      });
      renderWithProvider(<Assets />, storeEnabled);

      fireEvent.click(screen.getByTestId('autodetect-tokens'));

      expect(mockSetUseTokenDetection).toHaveBeenCalledWith(false);
    });

    it('calls action with true when toggled on', () => {
      const storeDisabled = configureMockStore([thunk])({
        ...mockState,
        metamask: { ...mockState.metamask, useTokenDetection: false },
      });
      renderWithProvider(<Assets />, storeDisabled);

      fireEvent.click(screen.getByTestId('autodetect-tokens'));

      expect(mockSetUseTokenDetection).toHaveBeenCalledWith(true);
    });
  });

  describe('snapshot', () => {
    it('matches snapshot', () => {
      const { container } = renderWithProvider(<Assets />, mockStore);

      expect(container).toMatchSnapshot();
    });
  });
});
