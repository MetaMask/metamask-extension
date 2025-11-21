import React from 'react';
import { fireEvent, waitFor } from '../../../../test/jest';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import {
  GATOR_PERMISSIONS,
  PERMISSIONS,
} from '../../../helpers/constants/routes';
import { isGatorPermissionsRevocationFeatureEnabled } from '../../../../shared/modules/environment';
import { getBrowserName } from '../../../../shared/modules/browser-runtime.utils';
import { useSidePanelEnabled } from '../../../hooks/useSidePanelEnabled';
import {
  ENVIRONMENT_TYPE_POPUP,
  PLATFORM_FIREFOX,
} from '../../../../shared/constants/app';
import { GlobalMenu } from '.';

const render = (metamaskStateChanges = {}) => {
  const store = configureStore({
    metamask: {
      ...mockState.metamask,
      ...metamaskStateChanges,
    },
  });
  return renderWithProvider(
    <GlobalMenu
      anchorElement={document.body}
      isOpen
      closeMenu={() => undefined}
    />,
    store,
  );
};

const mockUseNavigate = jest.fn();
jest.mock('react-router-dom-v5-compat', () => ({
  ...jest.requireActual('react-router-dom-v5-compat'),
  useNavigate: () => mockUseNavigate,
  Link: ({
    children,
    to,
    ...props
  }: React.PropsWithChildren<
    React.AnchorHTMLAttributes<HTMLAnchorElement> & { to?: string }
  >) => (
    <a {...props} href={to}>
      {children}
    </a>
  ),
}));

const mockLockMetaMask = jest.fn();

jest.mock('../../../store/actions', () => ({
  lockMetamask: () => mockLockMetaMask,
}));

jest.mock('../../../../shared/modules/environment');

jest.mock('../../../hooks/useSidePanelEnabled', () => ({
  useSidePanelEnabled: jest.fn(() => false),
}));

jest.mock('../../../../app/scripts/lib/util', () => ({
  ...jest.requireActual('../../../../app/scripts/lib/util'),
  getEnvironmentType: jest.fn(),
}));

jest.mock('../../../../shared/modules/browser-runtime.utils', () => ({
  ...jest.requireActual('../../../../shared/modules/browser-runtime.utils'),
  getBrowserName: jest.fn(),
}));

describe('Global Menu', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest
      .mocked(isGatorPermissionsRevocationFeatureEnabled)
      .mockReturnValue(false);
  });

  it('locks MetaMask when item is clicked', async () => {
    render();
    fireEvent.click(
      document.querySelector('[data-testid="global-menu-lock"]') as Element,
    );
    await waitFor(() => {
      expect(mockLockMetaMask).toHaveBeenCalled();
    });
  });

  it('disables the settings item when there is an active transaction', async () => {
    const { getByTestId } = render();
    await waitFor(() => {
      expect(getByTestId('global-menu-settings')).not.toHaveAttribute('href');
    });
  });

  it('enables the settings item when there is no active transaction', async () => {
    const { getByTestId } = render({ transactions: [] });
    await waitFor(() => {
      expect(getByTestId('global-menu-settings')).toBeEnabled();
    });
  });

  it('disables the connected sites item when there is an active transaction', async () => {
    const { getByTestId } = render();
    await waitFor(() => {
      expect(getByTestId('global-menu-connected-sites')).not.toHaveAttribute(
        'href',
      );
    });
  });

  it('enables the connected sites item when there is no active transaction', async () => {
    const { getByTestId } = render({ transactions: [] });
    await waitFor(() => {
      expect(getByTestId('global-menu-connected-sites')).toBeEnabled();
    });
  });

  it('expands metamask to tab when item is clicked (Firefox popup with sidepanel enabled)', async () => {
    // Mock environment to make expand button render (Firefox + Popup + SidePanel enabled)
    const { getEnvironmentType } = jest.requireMock(
      '../../../../app/scripts/lib/util',
    );
    jest.mocked(getBrowserName).mockReturnValue(PLATFORM_FIREFOX);
    jest.mocked(getEnvironmentType).mockReturnValue(ENVIRONMENT_TYPE_POPUP);
    jest.mocked(useSidePanelEnabled).mockReturnValue(true);

    // @ts-expect-error mocking platform
    global.platform = {
      openExtensionInBrowser: jest.fn(),
      openTab: jest.fn(),
      closeCurrentWindow: jest.fn(),
    };

    const { queryByTestId } = render();
    const expandButton = queryByTestId('global-menu-expand-view');

    // The button should exist with our mocks (Firefox + sidepanel enabled)
    expect(expandButton).toBeInTheDocument();

    if (expandButton) {
      fireEvent.click(expandButton);
      await waitFor(() => {
        expect(global.platform.openExtensionInBrowser).toHaveBeenCalled();
      });
    }
  });

  it('connected sites has correct href to /gator-permissions route when Gator Permissions Revocation feature is enabled', async () => {
    jest
      .mocked(isGatorPermissionsRevocationFeatureEnabled)
      .mockReturnValue(true);
    const { getByTestId } = render({ transactions: [] });
    await waitFor(() => {
      expect(getByTestId('global-menu-connected-sites')).toHaveAttribute(
        'href',
        GATOR_PERMISSIONS,
      );
    });
  });

  it('connected sites has correct href to /permissions route when Gator Permissions Revocation feature is disabled', async () => {
    jest
      .mocked(isGatorPermissionsRevocationFeatureEnabled)
      .mockReturnValue(false);
    const { getByTestId } = render({ transactions: [] });
    await waitFor(() => {
      expect(getByTestId('global-menu-connected-sites')).toHaveAttribute(
        'href',
        PERMISSIONS,
      );
    });
  });
});
