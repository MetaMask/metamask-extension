import React from 'react';
import { fireEvent, renderWithProvider, waitFor } from '../../../../test/jest';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
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

const mockLockMetaMask = jest.fn();
const mockSetAccountDetailsAddress = jest.fn();
jest.mock('../../../store/actions', () => ({
  lockMetamask: () => mockLockMetaMask,
  setAccountDetailsAddress: () => mockSetAccountDetailsAddress,
}));

describe('Global Menu', () => {
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
      expect(getByTestId('global-menu-settings')).toBeDisabled();
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
      expect(getByTestId('global-menu-connected-sites')).toBeDisabled();
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
});
