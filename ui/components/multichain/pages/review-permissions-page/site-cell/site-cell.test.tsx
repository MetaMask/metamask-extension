import React from 'react';
import { Provider } from 'react-redux';
import { render, fireEvent } from '@testing-library/react';
import configureStore from '../../../../../store/store';
import { SiteCell } from './site-cell';

describe('SiteCell', () => {
  const store = configureStore({
    metamask: {
      useBlockie: false,
    },
  });

  describe('toast handling', () => {
    it('should call hideAllToasts when edit accounts is clicked', () => {
      const hideAllToasts = jest.fn();
      const { getAllByTestId } = render(
        <Provider store={store}>
          <SiteCell
            nonTestNetworks={[]}
            testNetworks={[]}
            accounts={[]}
            onSelectAccountAddresses={() => undefined}
            onSelectChainIds={() => undefined}
            selectedAccountAddresses={[]}
            selectedChainIds={[]}
            hideAllToasts={hideAllToasts}
          />
        </Provider>,
      );

      const editButtons = getAllByTestId('edit');
      fireEvent.click(editButtons[0]);
      expect(hideAllToasts).toHaveBeenCalled();
    });

    it('should call hideAllToasts when edit networks is clicked', () => {
      const hideAllToasts = jest.fn();
      const { getAllByTestId } = render(
        <Provider store={store}>
          <SiteCell
            nonTestNetworks={[]}
            testNetworks={[]}
            accounts={[]}
            onSelectAccountAddresses={() => undefined}
            onSelectChainIds={() => undefined}
            selectedAccountAddresses={[]}
            selectedChainIds={[]}
            hideAllToasts={hideAllToasts}
          />
        </Provider>,
      );

      const editButtons = getAllByTestId('edit');
      fireEvent.click(editButtons[1]);
      expect(hideAllToasts).toHaveBeenCalled();
    });

    it('should not throw if hideAllToasts is not provided', () => {
      const { getAllByTestId } = render(
        <Provider store={store}>
          <SiteCell
            nonTestNetworks={[]}
            testNetworks={[]}
            accounts={[]}
            onSelectAccountAddresses={() => undefined}
            onSelectChainIds={() => undefined}
            selectedAccountAddresses={[]}
            selectedChainIds={[]}
          />
        </Provider>,
      );

      expect(() => {
        const editButtons = getAllByTestId('edit');
        fireEvent.click(editButtons[0]);
        fireEvent.click(editButtons[1]);
      }).not.toThrow();
    });
  });
});
