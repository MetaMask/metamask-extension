import React from 'react';
import { Hex } from '@metamask/utils';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers';
import { PermissionGroupListItem } from './permission-group-list-item';

describe('Permission List Item', () => {
  describe('render', () => {
    const mockChainId = '0x1' as Hex;
    const mockText = '2 token permissions';
    const mockOnClick = jest.fn();
    it('renders correctly', () => {
      const { container, getByTestId } = renderWithProvider(
        <PermissionGroupListItem
          chainId={mockChainId}
          text={mockText}
          onClick={() => mockOnClick()}
        />,
      );
      expect(container).toMatchSnapshot();

      expect(getByTestId('permission-group-list-item')).toBeInTheDocument();
    });
  });
});
