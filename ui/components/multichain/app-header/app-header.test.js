import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react';
import configureStore from '../../../store/store';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import mockState from '../../../../test/data/mock-state.json';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { getEnvironmentType } from '../../../../app/scripts/lib/util';
import { ENVIRONMENT_TYPE_POPUP } from '../../../../shared/constants/app';
import { openWindow } from '../../../helpers/utils/window';
import { SUPPORT_LINK } from '../../../../shared/lib/ui-utils';
import { AppHeader } from '.';

// TODO: Remove this mock when multichain accounts feature flag is entirely removed.
// TODO: Convert any old tests (UI/UX state 1) to its state 2 equivalent (if possible).
const mockIsMultichainAccountsFeatureEnabled = jest.fn();
jest.mock(
  '../../../../shared/lib/multichain-accounts/remote-feature-flag',
  () => ({
    ...jest.requireActual(
      '../../../../shared/lib/multichain-accounts/remote-feature-flag',
    ),
    isMultichainAccountsFeatureEnabled: () =>
      mockIsMultichainAccountsFeatureEnabled(),
  }),
);

jest.mock('../../../../app/scripts/lib/util', () => ({
  ...jest.requireActual('../../../../app/scripts/lib/util'),
  getEnvironmentType: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  // eslint-disable-next-line react/prop-types
  Link: ({ children, ...props }) => <a {...props}>{children}</a>,
  // eslint-disable-next-line react/prop-types
  CompatRouter: ({ children }) => <div>{children}</div>,
  matchPath: jest.fn(),
  useNavigate: () => jest.fn(),
}));

jest.mock('../../../helpers/utils/window', () => ({
  openWindow: jest.fn(),
}));

const render = ({
  stateChanges = {},
  location = {},
  isUnlocked = true,
} = {}) => {
  const store = configureStore({
    ...mockState,
    metamask: {
      ...mockState.metamask,
      isUnlocked: isUnlocked ?? true,
    },
    activeTab: {
      origin: 'https://remix.ethereum.org',
    },
    ...stateChanges,
  });
  return renderWithProvider(<AppHeader location={location} />, store);
};

describe('App Header', () => {
  beforeEach(() => {
    mockIsMultichainAccountsFeatureEnabled.mockReturnValue(true);
  });
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

  describe('unlocked state', () => {
    afterEach(() => {
      jest.clearAllMocks();
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
        const settingsMenu = document.querySelector(
          '[data-testid="global-menu-settings"]',
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
    });

    describe('Drawer support button', () => {
      beforeEach(async () => {
        const { container } = render();

        const settingsButton = container.querySelector(
          '[data-testid="account-options-menu-button"]',
        );
        fireEvent.click(settingsButton);

        // Menu is in portaled drawer; wait for Support button to be in document
        let globalMenuSupportButton;
        await waitFor(() => {
          globalMenuSupportButton = document.querySelector(
            '[data-testid="global-menu-support"]',
          );
          if (!globalMenuSupportButton) {
            throw new Error('Support button not found');
          }
        });
        fireEvent.click(globalMenuSupportButton);
        // Wait for consent modal to be open so drawer-close and modal-open updates are flushed (avoids Act warnings)
        await waitFor(() => {
          if (
            !document.querySelector(
              '[data-testid="visit-support-data-consent-modal"]',
            )
          ) {
            throw new Error('Consent modal not open');
          }
        });
      });

      it('can open the visit support data consent modal', async () => {
        await waitFor(() => {
          const supportDataConsentModal = document.querySelector(
            '[data-testid="visit-support-data-consent-modal"]',
          );
          expect(supportDataConsentModal).toBeInTheDocument();
        });
      });

      it('opens the support site when "Confirm" button is clicked', async () => {
        let acceptButton;
        await waitFor(() => {
          acceptButton = document.querySelector(
            '[data-testid="visit-support-data-consent-modal-accept-button"]',
          );
          expect(acceptButton).toBeInTheDocument();
        });
        fireEvent.click(acceptButton);

        await waitFor(() => {
          expect(openWindow).toHaveBeenCalled();
        });
      });

      it(`opens the support site when "Don't share" button is clicked`, async () => {
        let rejectButton;
        await waitFor(() => {
          rejectButton = document.querySelector(
            '[data-testid="visit-support-data-consent-modal-reject-button"]',
          );
          expect(rejectButton).toBeInTheDocument();
        });
        fireEvent.click(rejectButton);

        await waitFor(() => {
          expect(openWindow).toHaveBeenCalledWith(SUPPORT_LINK);
        });
      });
    });
  });

  describe('locked state', () => {
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
});
