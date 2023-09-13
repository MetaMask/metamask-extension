import React from 'react';
import { waitFor, fireEvent } from '@testing-library/react';
import { renderWithProvider } from '../../../../../test/jest';
import SnapRemoveWarning from './snap-remove-warning';

const mockOnCancel = jest.fn();
const mockOnSubmit = jest.fn();
const snapName = 'test-snap';

const defaultArgs = {
  isOpen: true,
  onCancel: mockOnCancel,
  onSubmit: mockOnSubmit,
  snapName,
  snapUrl: 'test-snap-url',
};

describe('Snap Remove Warning', () => {
  describe('Snap Warning', () => {
    it('should render the snap warning and content', async () => {
      const { getByText } = renderWithProvider(
        <SnapRemoveWarning {...defaultArgs} />,
      );
      expect(getByText('Please confirm')).toBeInTheDocument();
      expect(
        getByText(`Are you sure you want to remove ${snapName}?`),
      ).toBeInTheDocument();

      await waitFor(() => {
        const removeSnapButton = getByText('Remove snap');
        fireEvent.click(removeSnapButton);
        expect(mockOnSubmit).toBeCalled();
      });
    });
  });
});
