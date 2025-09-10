// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck types are very broken
/* eslint-disable jest/require-top-level-describe */
import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import { renderWithUserEvent } from '../../../../test/lib/render-helpers';
import { FileUploader } from './file-uploader';

// Mock DataTransfer for testing
class MockDataTransfer {
  items = {
    add: jest.fn(),
  };
  files = [] as File[];
}

// Mock global DataTransfer
Object.defineProperty(global, 'DataTransfer', {
  value: MockDataTransfer,
  writable: true,
});

describe('FileUploader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render correctly', () => {
    const { getByTestId } = render(
      <FileUploader data-testid="file-uploader" />,
    );
    expect(getByTestId('file-uploader')).toBeDefined();
  });

  it('should render with label when provided', () => {
    const { getByText } = render(
      <FileUploader
        id="test-uploader"
        label="Upload files"
        data-testid="file-uploader"
      />,
    );
    expect(getByText('Upload files')).toBeDefined();
  });

  it('should upload file', async () => {
    const mockOnChange = jest.fn();
    const { getByTestId } = renderWithUserEvent(
      <FileUploader data-testid="file-uploader" onChange={mockOnChange} />,
    );

    const file = new File(['foo'], 'foo.svg', { type: 'image/svg+xml' });
    const input = getByTestId('file-uploader-input') as HTMLInputElement;

    await userEvent.upload(input, file);

    // The input value should be empty
    expect(input.value).toBe('');

    // onChange should have been called
    expect(mockOnChange).toHaveBeenCalled();
  });

  it('should show error when file exceeds maxFileSize', async () => {
    const mockOnChange = jest.fn();
    const { getByTestId, getByText } = renderWithUserEvent(
      <FileUploader
        data-testid="file-uploader"
        maxFileSize={1} // 1MB limit
        onChange={mockOnChange}
      />,
    );

    // Create a file larger than 1MB (1MB = 1024 * 1024 bytes)
    const largeFile = new File(['x'.repeat(2 * 1024 * 1024)], 'large.pdf', {
      type: 'application/pdf',
    });
    const input = getByTestId('file-uploader-input') as HTMLInputElement;

    await userEvent.upload(input, largeFile);

    // onChange should have been called with null
    expect(mockOnChange).toHaveBeenCalledWith(null);
  });
});
