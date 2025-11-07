import React from 'react';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers';
import { PermissionListItem } from './permission-list-item';

describe('Permission List Item', () => {
  describe('render', () => {
    const mockTotal = 1;
    const mockName = 'sites';
    const mockOnClick = jest.fn();
    it('renders correctly', () => {
      const { container, getByTestId } = renderWithProvider(
        <PermissionListItem
          total={mockTotal}
          permissionGroupName={mockName}
          onClick={() => mockOnClick()}
        />,
      );
      expect(container).toMatchSnapshot();

      expect(getByTestId('permission-list-item')).toBeInTheDocument();
    });
  });
});
