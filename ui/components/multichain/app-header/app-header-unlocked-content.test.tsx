import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
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

describe('AppHeaderUnlockedContent trace', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls trace ShowAccountList when AccountPicker is clicked in multichain mode', () => {
    const store = configureStore(mockDefaultState);
    const menuRef = { current: null } as React.RefObject<HTMLButtonElement>;
    renderWithProvider(
      <AppHeaderUnlockedContent
        disableAccountPicker={false}
        menuRef={menuRef}
      />,
      store,
    );

    const accountName = screen.getByText('Account 1');
    fireEvent.click(accountName);

    const traceLib = jest.requireMock('../../../../shared/lib/trace');
    expect(traceLib.trace).toHaveBeenCalledWith(
      expect.objectContaining({ name: traceLib.TraceName.ShowAccountList }),
    );
    expect(mockNavigate).toHaveBeenCalledWith('/account-list');
  });

  it('calls trace ShowAccountAddressList when View All button is clicked in address popover', async () => {
    const store = configureStore(mockDefaultState);
    const menuRef = { current: null } as React.RefObject<HTMLButtonElement>;
    renderWithProvider(
      <AppHeaderUnlockedContent
        disableAccountPicker={false}
        menuRef={menuRef}
      />,
      store,
    );

    const networksSubtitle = screen.getByTestId('networks-subtitle-test-id');
    // The hover handler is on the first child Box inside MultichainHoveredAddressRowsList
    const hoverTarget = networksSubtitle.firstElementChild as HTMLElement;
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
  it('renders the default address when feature flag is on', async () => {
    const stateWithFlagOn = {
      ...mockDefaultState,
      metamask: {
        ...mockDefaultState.metamask,
        remoteFeatureFlags: { extensionUxDefaultAddress: true },
        preferences: {
          ...mockDefaultState.metamask.preferences,
          showDefaultAddress: true,
        },
      },
    };
    const store = configureStore(stateWithFlagOn);
    const menuRef = { current: null } as React.RefObject<HTMLButtonElement>;
    renderWithProvider(
      <AppHeaderUnlockedContent
        disableAccountPicker={false}
        menuRef={menuRef}
      />,
      store,
    );

    const container = await screen.findByTestId('default-address-container');
    await waitFor(() => expect(container).toBeVisible());
  });

  it('does not render the default address when feature flag is off', async () => {
    const stateWithFlagOff = {
      ...mockDefaultState,
      metamask: {
        ...mockDefaultState.metamask,
        remoteFeatureFlags: { extensionUxDefaultAddress: false },
        preferences: {
          ...mockDefaultState.metamask.preferences,
          showDefaultAddress: true,
        },
      },
    };
    const store = configureStore(stateWithFlagOff);
    const menuRef = { current: null } as React.RefObject<HTMLButtonElement>;
    renderWithProvider(
      <AppHeaderUnlockedContent
        disableAccountPicker={false}
        menuRef={menuRef}
      />,
      store,
    );

    await waitFor(() => {
      expect(
        screen.queryByTestId('default-address-container'),
      ).not.toBeInTheDocument();
    });
  });
});
