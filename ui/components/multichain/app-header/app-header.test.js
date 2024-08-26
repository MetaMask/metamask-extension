import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react';
import configureStore from '../../../store/store';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import mockState from '../../../../test/data/mock-state.json';
import { SEND_STAGES } from '../../../ducks/send';
import { getEnvironmentType } from '../../../../app/scripts/lib/util';
import { ENVIRONMENT_TYPE_POPUP } from '../../../../shared/constants/app';
import { mockNetworkState } from '../../../../test/stub/networks';
import { AppHeader } from '.';

jest.mock('../../../../app/scripts/lib/util', () => ({
  ...jest.requireActual('../../../../app/scripts/lib/util'),
  getEnvironmentType: jest.fn(),
}));

const mockUseHistory = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useHistory: () => ({
    push: mockUseHistory,
  }),
}));

const render = ({
  stateChanges = {},
  network = { chainId: '0x5', nickname: 'Chain 5', ticker: 'ETH' },
  location = {},
  isUnlocked = true,
} = {}) => {
  const store = configureStore({
    ...mockState,
    metamask: {
      ...mockState.metamask,
      ...mockNetworkState(network),
      isUnlocked: isUnlocked ?? true,
    },
    activeTab: {
      origin: 'https://remix.ethereum.org',
    },
    ...(stateChanges ?? {}),
  });
  return renderWithProvider(<AppHeader location={location} />, store);
};

describe('App Header', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  it('unlocked state matches snapshot', () => {
    const { container } = render();
    expect(container).toMatchSnapshot('unlocked');
  });

  it('locked state matches snapshot', () => {
    const { container } = render({ isUnlocked: false });
    expect(container).toMatchSnapshot('locked');
  });

  describe('send stage', () => {
    it('should disable the network picker during a send', () => {
      const { getByTestId } = render({
        stateChanges: { send: { stage: SEND_STAGES.DRAFT } },
      });
      expect(getByTestId('network-display')).toBeDisabled();
    });

    it('should allow switching accounts during a send', () => {
      const { getByTestId } = render({
        stateChanges: { send: { stage: SEND_STAGES.DRAFT } },
      });
      expect(getByTestId('account-menu-icon')).toBeEnabled();
    });

    it('should show the copy button for multichain', () => {
      const { getByTestId } = render({
        stateChanges: { send: { stage: SEND_STAGES.DRAFT } },
      });
      expect(getByTestId('app-header-copy-button')).toBeEnabled();
    });
  });

  describe('unlocked state', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });
    it('can open the network picker', () => {
      const { container } = render();
      const networkPickerButton = container.querySelector(
        '.multichain-app-header__contents__network-picker',
      );
      expect(networkPickerButton).toBeInTheDocument();
      fireEvent.click(networkPickerButton);

      const networkPicker = container.querySelector('.mm-picker-network');
      expect(networkPicker).toBeInTheDocument();
    });

    it('can open the account list', () => {
      const { container } = render();
      const accountPickerButton = container.querySelector(
        '.multichain-account-picker',
      );
      expect(accountPickerButton).toBeInTheDocument();
    });

    it('can open the settings', async () => {
      const { container } = render();
      const settingsButton = container.querySelector(
        '[data-testid="account-options-menu-button"]',
      );
      expect(settingsButton).toBeInTheDocument();
      fireEvent.click(settingsButton);

      await waitFor(() => {
        const settingsMenu = container.querySelector(
          '[data-testid="global-menu"]',
        );
        expect(settingsMenu).toBeInTheDocument();
      });
    });

    it('can open the dapp connection', () => {
      getEnvironmentType.mockReturnValue(ENVIRONMENT_TYPE_POPUP);
      const { container } = render();
      const connectionPickerButton = container.querySelector(
        '[data-testid="connection-menu"]',
      );
      expect(connectionPickerButton).toBeInTheDocument();
      fireEvent.click(connectionPickerButton);

      expect(mockUseHistory).toHaveBeenCalled();
    });
  });

  describe('locked state', () => {
    it('can open the network picker', () => {
      const { container } = render({
        isUnlocked: false,
      });
      const networkPickerButton = container.querySelector(
        '.multichain-app-header__contents__network-picker',
      );
      expect(networkPickerButton).toBeInTheDocument();
      fireEvent.click(networkPickerButton);

      const networkPicker = container.querySelector('.mm-picker-network');
      expect(networkPicker).toBeInTheDocument();
    });

    it('does not show the account picker', () => {
      const { container } = render({
        isUnlocked: false,
      });
      const accountPickerButton = container.querySelector(
        '.multichain-account-picker',
      );
      expect(accountPickerButton).not.toBeInTheDocument();
    });

    it('does not show the settings', async () => {
      const { container } = render({
        isUnlocked: false,
      });
      const settingsButton = container.querySelector(
        '[data-testid="account-options-menu-button"]',
      );
      expect(settingsButton).not.toBeInTheDocument();
    });

    it('does not show dapp connection', () => {
      const { container } = render({
        isUnlocked: false,
      });
      const connectionPickerButton = container.querySelector(
        '[data-testid="connection-menu"]',
      );
      expect(connectionPickerButton).not.toBeInTheDocument();
    });
  });

  describe('network picker', () => {
    it('shows custom rpc if it has the same chainId as a default network', () => {
      const mockProviderConfig = {
        chainId: '0x1',
        rpcUrl: 'https://localhost:8545',
        nickname: 'Localhost',
      };

      const { getByText } = render({
        network: mockProviderConfig,
        isUnlocked: true,
      });
      expect(getByText(mockProviderConfig.nickname)).toBeInTheDocument();
    });

    it("shows rpc url as nickname if there isn't a nickname set", () => {
      const mockProviderConfig = {
        chainId: '0x1',
        rpcUrl: 'https://localhost:8545',
        nickname: null,
      };

      const { getByText } = render({
        network: mockProviderConfig,
        isUnlocked: true,
      });
      expect(getByText(mockProviderConfig.rpcUrl)).toBeInTheDocument();
    });
  });
});
