import React from 'react';
import { Hex } from '@metamask/utils';
import mockState from '../../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers';
import configureStore from '../../../../../store/store';

import { PermissionGroupListItem } from './permission-group-list-item';

const store = configureStore({
  ...mockState,
  metamask: {
    ...mockState.metamask,
  },
});

describe('Permission List Item', () => {
  describe('render', () => {
    const mockChainId = '0x5' as Hex;
    const mockText = '2 token permissions';
    const mockOnClick = jest.fn();
    it('renders correctly', () => {
      const { container, getByTestId } = renderWithProvider(
        <PermissionGroupListItem
          chainId={mockChainId}
          text={mockText}
          onClick={() => mockOnClick()}
        />,
        store,
      );
      expect(container).toMatchSnapshot();

      expect(getByTestId('permission-group-list-item')).toBeInTheDocument();
    });
  });
});
