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
    <GlobalMenu anchorElement={document.body} closeMenu={() => undefined} />,
    store,
  );
};

const mockLockMetaMask = jest.fn();
const mockSetAccountDetailsAddress = jest.fn();
jest.mock('../../../store/actions', () => ({
  lockMetamask: () => mockLockMetaMask,
  setAccountDetailsAddress: () => mockSetAccountDetailsAddress,
}));

describe('AccountListItem', () => {
  it('locks MetaMask when item is clicked', async () => {
    render();
    fireEvent.click(document.querySelector('[data-testid="global-menu-lock"]'));
    await waitFor(() => {
      expect(mockLockMetaMask).toHaveBeenCalled();
    });
  });

  it('opens the support site when item is clicked', async () => {
    global.platform = { openTab: jest.fn() };

    const { getByTestId } = render();
    fireEvent.click(getByTestId('global-menu-support'));
    await waitFor(() => {
      expect(global.platform.openTab).toHaveBeenCalled();
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
    global.platform = { openExtensionInBrowser: jest.fn() };

    render();
    fireEvent.click(
      document.querySelector('[data-testid="global-menu-expand"]'),
    );
    await waitFor(() => {
      expect(global.platform.openExtensionInBrowser).toHaveBeenCalled();
    });
  });
});
