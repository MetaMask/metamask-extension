import React from 'react';
import { fireEvent } from '@testing-library/react';
import { renderWithProvider } from '../../../../../../test/jest';
import configureStore from '../../../../../store/store';
import mockState from '../../../../../../test/data/mock-state.json';
import { SiteCell } from './site-cell';

describe('SiteCell', () => {
  const store = configureStore({
    metamask: {
      ...mockState.metamask,
    },
  });

  const defaultProps = {
    nonTestNetworks: [],
    testNetworks: [],
    accounts: [],
    onSelectAccountAddresses: jest.fn(),
    onSelectChainIds: jest.fn(),
    selectedAccountAddresses: [],
    selectedChainIds: [],
  };

  describe('toast handling', () => {
    it('should call hideAllToasts when edit accounts is clicked', () => {
      const hideAllToasts = jest.fn();
      const { getByTestId } = renderWithProvider(
        <SiteCell {...defaultProps} hideAllToasts={hideAllToasts} />,
        store,
      );

      fireEvent.click(getByTestId('edit-accounts'));
      expect(hideAllToasts).toHaveBeenCalled();
    });

    it('should call hideAllToasts when edit networks is clicked', () => {
      const hideAllToasts = jest.fn();
      const { getByTestId } = renderWithProvider(
        <SiteCell {...defaultProps} hideAllToasts={hideAllToasts} />,
        store,
      );

      fireEvent.click(getByTestId('edit-networks'));
      expect(hideAllToasts).toHaveBeenCalled();
    });

    it('should not throw if hideAllToasts is not provided', () => {
      const { getByTestId } = renderWithProvider(
        <SiteCell {...defaultProps} />,
        store,
      );

      expect(() => {
        fireEvent.click(getByTestId('edit-accounts'));
        fireEvent.click(getByTestId('edit-networks'));
      }).not.toThrow();
    });
  });
});
