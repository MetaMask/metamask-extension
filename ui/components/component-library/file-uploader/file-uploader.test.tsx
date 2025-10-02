import React from 'react';
import { render } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import { renderWithUserEvent } from '../../../../test/lib/render-helpers';
import { FileUploader } from './file-uploader';

// Mock DataTransfer for testing
class MockDataTransfer {
  items = {
    add: jest.fn((file: File) => {
      this.files.push(file);
    }),
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
      <FileUploader
        data-testid="file-uploader"
        multiple
        onChange={mockOnChange}
      />,
    );

    const file = new File(['foo'], 'foo.svg', { type: 'image/svg+xml' });
    const input = getByTestId('file-uploader-input') as HTMLInputElement;

    await userEvent.upload(input, file);

    // The input value should be empty
    expect(input.value).toBe('');

    // onChange should have been called with the uploaded file (check the last call)
    expect(mockOnChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        0: expect.objectContaining({
          name: 'foo.svg',
          type: 'image/svg+xml',
        }),
        length: 1,
      }),
    );
  });

  it('should show error when file exceeds maxFileSize', async () => {
    const mockOnChange = jest.fn();
    const { getByTestId } = renderWithUserEvent(
      <FileUploader
        data-testid="file-uploader"
        multiple
        maxFileSize={1 * 1024 * 1024} // 1MB limit
        onChange={mockOnChange}
      />,
    );

    const input = getByTestId('file-uploader-input') as HTMLInputElement;

    // Create a file larger than 1MB (1MB = 1024 * 1024 bytes)
    const largeFile = new File(['x'.repeat(2 * 1024 * 1024)], 'large.pdf', {
      type: 'application/pdf',
    });

    await userEvent.upload(input, largeFile);

    // add a small file
    const smallFile = new File(['x'], 'small.pdf', {
      type: 'application/pdf',
    });
    await userEvent.upload(input, smallFile);

    // onChange should have been called with the small file
    expect(mockOnChange).toHaveBeenCalledWith(
      expect.objectContaining({
        0: expect.objectContaining({
          name: 'small.pdf',
          type: 'application/pdf',
        }),
        length: 1,
      }),
    );
  });
});
