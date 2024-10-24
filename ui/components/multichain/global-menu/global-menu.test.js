import React from 'react';
import { fireEvent, renderWithProvider, waitFor } from '../../../../test/jest';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { GlobalMenu } from '.';

const trackEventMock = jest.fn();

const render = (metamaskStateChanges = {}) => {
  const store = configureStore({
    metamask: {
      ...mockState.metamask,
      ...metamaskStateChanges,
    },
  });

  return renderWithProvider(
    <MetaMetricsContext.Provider value={trackEventMock}>
      <GlobalMenu
        anchorElement={document.body}
        isOpen
        closeMenu={() => undefined}
      />
    </MetaMetricsContext.Provider>,

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

  it('opens the spending caps URL and tracks the event when the spending caps item is clicked', async () => {
    global.platform = { openTab: jest.fn() };
    const { getByTestId } = render();
    fireEvent.click(getByTestId('global-menu-spending-caps'));

    await waitFor(() => {
      expect(global.platform.openTab).toHaveBeenCalledWith({
        url: expect.stringContaining('spending-caps'),
      });
      expect(trackEventMock).toHaveBeenCalledWith({
        category: MetaMetricsEventCategory.Home,
        event: MetaMetricsEventName.PortfolioLinkClicked,
        properties: {
          url: expect.stringContaining('spending-caps'),
          location: 'Global Menu',
        },
      });
    });
  });
});
