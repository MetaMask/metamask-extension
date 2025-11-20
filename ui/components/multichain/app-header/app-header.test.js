import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react';
import configureStore from '../../../store/store';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import mockState from '../../../../test/data/mock-state.json';
import { SEND_STAGES } from '../../../ducks/send';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { getEnvironmentType } from '../../../../app/scripts/lib/util';
import { ENVIRONMENT_TYPE_POPUP } from '../../../../shared/constants/app';
import { AppHeader } from '.';

jest.mock('../../../../app/scripts/lib/util', () => ({
  ...jest.requireActual('../../../../app/scripts/lib/util'),
  getEnvironmentType: jest.fn(),
}));

jest.mock('react-router-dom-v5-compat', () => ({
  // eslint-disable-next-line react/prop-types
  Link: ({ children, ...props }) => <a {...props}>{children}</a>,
  // eslint-disable-next-line react/prop-types
  CompatRouter: ({ children }) => <div>{children}</div>,
  matchPath: jest.fn(),
  useNavigate: () => jest.fn(),
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
    });

    describe('Global menu support button', () => {
      beforeEach(() => {
        const { container } = render();

        const settingsButton = container.querySelector(
          '[data-testid="account-options-menu-button"]',
        );
        fireEvent.click(settingsButton);

        const globalMenuSupportButton = container.querySelector(
          '[data-testid="global-menu-support"]',
        );
        fireEvent.click(globalMenuSupportButton);
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
        const spy = jest.spyOn(window, 'open');

        const acceptButton = document.querySelector(
          '[data-testid="visit-support-data-consent-modal-accept-button"]',
        );
        expect(acceptButton).toBeInTheDocument();
        fireEvent.click(acceptButton);

        await waitFor(() => {
          expect(spy).toHaveBeenCalled();
        });
      });

      it(`opens the support site when "Don't share" button is clicked`, async () => {
        const spy = jest.spyOn(window, 'open');

        const rejectButton = document.querySelector(
          '[data-testid="visit-support-data-consent-modal-reject-button"]',
        );
        expect(rejectButton).toBeInTheDocument();
        fireEvent.click(rejectButton);

        await waitFor(() => {
          expect(spy).toHaveBeenCalled();
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
