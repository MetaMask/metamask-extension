import React from 'react';
import { fireEvent, renderWithProvider, waitFor } from '../../../../test/jest';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import {
  GATOR_PERMISSIONS,
  PERMISSIONS,
} from '../../../helpers/constants/routes';
import { isGatorPermissionsRevocationFeatureEnabled } from '../../../../shared/modules/environment';
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

jest.mock('react-router-dom-v5-compat', () => ({
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
const mockSetAccountDetailsAddress = jest.fn();
jest.mock('../../../store/actions', () => ({
  lockMetamask: () => mockLockMetaMask,
  setAccountDetailsAddress: () => mockSetAccountDetailsAddress,
}));

jest.mock('../../../../shared/modules/environment');

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

  it('expands metamask to tab when item is clicked', async () => {
    // @ts-expect-error mocking platform
    global.platform = {
      openExtensionInBrowser: jest.fn(),
      openTab: jest.fn(),
      closeCurrentWindow: jest.fn(),
    };

    render();
    fireEvent.click(
      document.querySelector('[data-testid="global-menu-expand"]') as Element,
    );
    await waitFor(() => {
      expect(global.platform.openExtensionInBrowser).toHaveBeenCalled();
    });
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
