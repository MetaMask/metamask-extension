import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { SUPPORT_LINK } from '#shared/lib/ui-utils';
import { openWindow } from '#ui/helpers/utils/window';
import configureStore from '../../../store/store';
import mockDefaultState from '../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import { AppHeaderUnlockedContent } from './app-header-unlocked-content';

jest.mock('../../../../shared/lib/trace', () => {
  const actual = jest.requireActual('../../../../shared/lib/trace');
  return {
    ...actual,
    trace: jest.fn(),
    endTrace: jest.fn(),
  };
});

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('../../../store/actions', () => ({
  ...jest.requireActual('../../../store/actions'),
  getCustomerServiceToken: jest
    .fn()
    .mockResolvedValue('test-customer-service-token'),
}));

jest.mock('#ui/helpers/utils/window', () => ({
  openWindow: jest.fn(),
}));

describe('AppHeaderUnlockedContent trace', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls trace ShowAccountList when AccountPicker is clicked in multichain mode', async () => {
    const store = configureStore(mockDefaultState);
    const menuRef = { current: null } as React.RefObject<HTMLButtonElement>;
    renderWithProvider(<AppHeaderUnlockedContent menuRef={menuRef} />, store);

    const accountName = await screen.findByText('Account 1');
    fireEvent.click(accountName);

    const traceLib = jest.requireMock('../../../../shared/lib/trace');
    await waitFor(() => {
      expect(traceLib.trace).toHaveBeenCalledWith(
        expect.objectContaining({ name: traceLib.TraceName.ShowAccountList }),
      );
    });
    expect(mockNavigate).toHaveBeenCalledWith('/account-list');
  });

  it('calls trace ShowAccountAddressList when View All button is clicked in address popover', async () => {
    const store = configureStore(mockDefaultState);
    const menuRef = { current: null } as React.RefObject<HTMLButtonElement>;
    renderWithProvider(<AppHeaderUnlockedContent menuRef={menuRef} />, store);

    const hoverTarget = screen.getByTestId('multichain-address-rows-trigger');
    fireEvent.mouseEnter(hoverTarget);

    await waitFor(() => {
      expect(
        screen.getByTestId('multichain-address-rows-list'),
      ).toBeInTheDocument();
    });

    const viewAllButton = screen.getByText(
      messages.multichainAddressViewAll.message,
    );
    fireEvent.click(viewAllButton);

    const traceLib = jest.requireMock('../../../../shared/lib/trace');
    expect(traceLib.trace).toHaveBeenCalledWith(
      expect.objectContaining({
        name: traceLib.TraceName.ShowAccountAddressList,
      }),
    );
  });
});

describe('Default address section', () => {
  it('renders the default address when feature flag and preference is on', async () => {
    const stateWithFlagOn = {
      ...mockDefaultState,
      metamask: {
        ...mockDefaultState.metamask,
        remoteFeatureFlags: { extensionUxDefaultAddressVersioned: true },
        preferences: {
          ...mockDefaultState.metamask.preferences,
          showDefaultAddress: true,
        },
      },
    };
    const store = configureStore(stateWithFlagOn);
    const menuRef = { current: null } as React.RefObject<HTMLButtonElement>;
    renderWithProvider(<AppHeaderUnlockedContent menuRef={menuRef} />, store);

    await waitFor(() => {
      expect(
        screen.queryByTestId('default-address-container'),
      ).toBeInTheDocument();
    });
  });

  it('does not render the default address text when preference is off', async () => {
    const stateWithPreferenceOff = {
      ...mockDefaultState,
      metamask: {
        ...mockDefaultState.metamask,
        remoteFeatureFlags: { extensionUxDefaultAddressVersioned: true },
        preferences: {
          ...mockDefaultState.metamask.preferences,
          showDefaultAddress: false,
        },
      },
    };
    const store = configureStore(stateWithPreferenceOff);
    const menuRef = { current: null } as React.RefObject<HTMLButtonElement>;
    renderWithProvider(<AppHeaderUnlockedContent menuRef={menuRef} />, store);

    await waitFor(() => {
      expect(
        screen.queryByTestId('default-address-container'),
      ).not.toBeInTheDocument();
    });
  });
});

describe('Global menu', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('opens settings from the account options menu', async () => {
    const store = configureStore(mockDefaultState);
    const menuRef = { current: null } as React.RefObject<HTMLButtonElement>;
    renderWithProvider(<AppHeaderUnlockedContent menuRef={menuRef} />, store);

    fireEvent.click(screen.getByTestId('account-options-menu-button'));

    expect(
      await screen.findByTestId('global-menu-settings'),
    ).toBeInTheDocument();
  });

  describe('Support', () => {
    beforeEach(async () => {
      const store = configureStore(mockDefaultState);
      const menuRef = { current: null } as React.RefObject<HTMLButtonElement>;
      renderWithProvider(<AppHeaderUnlockedContent menuRef={menuRef} />, store);

      fireEvent.click(screen.getByTestId('account-options-menu-button'));
      fireEvent.click(await screen.findByTestId('global-menu-support'));

      await screen.findByTestId('visit-support-data-consent-modal');
    });

    it('opens the visit support data consent modal', async () => {
      expect(
        await screen.findByTestId('visit-support-data-consent-modal'),
      ).toBeInTheDocument();
    });

    it('opens the support site when Confirm is clicked', async () => {
      fireEvent.click(
        await screen.findByTestId(
          'visit-support-data-consent-modal-accept-button',
        ),
      );

      await waitFor(() => {
        expect(openWindow).toHaveBeenCalled();
      });
    });

    it('opens the support site when Do not share is clicked', async () => {
      fireEvent.click(
        await screen.findByTestId(
          'visit-support-data-consent-modal-reject-button',
        ),
      );

      await waitFor(() => {
        expect(openWindow).toHaveBeenCalledWith(SUPPORT_LINK);
      });
    });
  });
});
