import React from 'react';
import { renderWithProvider, fireEvent, waitFor } from '../../../../test/jest';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import { GlobalMenu } from '.';

const render = () => {
  const store = configureStore({
    metamask: {
      ...mockState.metamask,
    },
  });
  return renderWithProvider(
    <GlobalMenu anchorElement={document.body} closeMenu={() => undefined} />,
    store,
  );
};

const mockLockMetaMask = jest.fn();
jest.mock('../../../store/actions', () => ({
  lockMetamask: () => mockLockMetaMask,
}));

describe('AccountListItem', () => {
  it('locks MetaMask when item is clicked', async () => {
    render();
    fireEvent.click(document.querySelector('[data-testid="global-menu-lock"]'));
    await waitFor(() => {
      expect(mockLockMetaMask).toHaveBeenCalled();
    });
  });

  it('opens the portfolio site when item is clicked', async () => {
    global.platform = { openTab: jest.fn() };

    const { getByTestId } = render();
    fireEvent.click(getByTestId('global-menu-portfolio'));
    await waitFor(() => {
      expect(global.platform.openTab).toHaveBeenCalledWith({
        url: `/?metamaskEntry=ext&metametricsId=`,
      });
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
