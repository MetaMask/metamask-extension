import React from 'react';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers';
import { PermissionGroupListItem } from './permission-group-list-item';

describe('Permission List Item', () => {
  describe('render', () => {
    const mockTotal = 1;
    const mockChainId = '0x1';
    const mockName = 'token permissions';
    const mockOnClick = jest.fn();
    it('renders correctly', () => {
      const { container, getByTestId } = renderWithProvider(
        <PermissionGroupListItem
          chainId={mockChainId}
          total={mockTotal}
          description={mockName}
          onClick={() => mockOnClick()}
        />,
      );
      expect(container).toMatchSnapshot();

      expect(getByTestId('permission-group-list-item')).toBeInTheDocument();
    });
  });
});
