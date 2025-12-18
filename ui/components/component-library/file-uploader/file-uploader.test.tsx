import React from 'react';
import { render, fireEvent } from '@testing-library/react';
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

  // Reset method to clear files between tests
  reset() {
    this.files = [];
    jest.clearAllMocks();
  }
}

// Create a singleton instance
const mockDataTransferInstance = new MockDataTransfer();

// Mock global DataTransfer
Object.defineProperty(global, 'DataTransfer', {
  value: MockDataTransfer,
  writable: true,
});

describe('FileUploader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the mock DataTransfer instance to prevent test pollution
    mockDataTransferInstance.reset();
  });

  it('should render file uploader correctly', () => {
    const { getByTestId } = render(
      <FileUploader data-testid="file-uploader" />,
    );
    expect(getByTestId('file-uploader')).toBeDefined();
  });

  it('should render label, help text, accept text when provided', () => {
    const { getByText } = render(
      <FileUploader
        id="test-uploader"
        label="Upload files"
        data-testid="file-uploader"
        helpText="Help text"
        acceptText="Accept text"
      />,
    );
    expect(getByText('Upload files')).toBeDefined();
    expect(getByText('Help text')).toBeDefined();
    expect(getByText('Accept text')).toBeDefined();
  });

  it('should upload single file successfully', async () => {
    const mockOnChange = jest.fn();
    const { getByTestId } = renderWithUserEvent(
      <FileUploader data-testid="file-uploader" onChange={mockOnChange} />,
    );
    const file = new File(['foo'], 'foo.svg', { type: 'image/svg+xml' });
    const input = getByTestId('file-uploader-input') as HTMLInputElement;

    await userEvent.upload(input, file);

    expect(input.value).toBe('');
    expect(mockOnChange).toHaveBeenCalledWith(
      expect.objectContaining({
        0: expect.objectContaining({
          name: 'foo.svg',
          type: 'image/svg+xml',
        }),
        length: 1,
      }),
    );
  });

  it('should reject files exceeding maxFileSize and accept smaller files', async () => {
    const mockOnChange = jest.fn();
    const { getByTestId } = renderWithUserEvent(
      <FileUploader
        data-testid="file-uploader"
        maxFileSize={1 * 1024 * 1024} // 1MB limit
        onChange={mockOnChange}
      />,
    );
    const input = getByTestId('file-uploader-input') as HTMLInputElement;
    const largeFile = new File(['x'.repeat(2 * 1024 * 1024)], 'large.pdf', {
      type: 'application/pdf',
    });
    const smallFile = new File(['x'], 'small.pdf', {
      type: 'application/pdf',
    });

    await userEvent.upload(input, largeFile);
    await userEvent.upload(input, smallFile);

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

  it('should handle file validation with accept prop', async () => {
    const mockOnChange = jest.fn();
    const { getByTestId } = renderWithUserEvent(
      <FileUploader
        data-testid="file-uploader"
        accept="image/png,image/jpeg"
        onChange={mockOnChange}
      />,
    );
    const input = getByTestId('file-uploader-input') as HTMLInputElement;
    const validFile = new File(['image'], 'image.png', { type: 'image/png' });

    mockOnChange.mockClear();

    await userEvent.upload(input, validFile);

    expect(mockOnChange).toHaveBeenCalledWith(
      expect.objectContaining({
        0: expect.objectContaining({
          name: 'image.png',
          type: 'image/png',
        }),
        length: 1,
      }),
    );
  });

  it('should skip duplicate files silently', async () => {
    const mockOnChange = jest.fn();
    const { getByTestId } = renderWithUserEvent(
      <FileUploader data-testid="file-uploader" onChange={mockOnChange} />,
    );
    const input = getByTestId('file-uploader-input') as HTMLInputElement;
    const originalFile = new File(['content1'], 'test.txt', {
      type: 'text/plain',
    });
    const duplicateFile = new File(['content2'], 'test.txt', {
      type: 'text/plain',
    });

    await userEvent.upload(input, originalFile);
    await userEvent.upload(input, duplicateFile);

    expect(mockOnChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        length: 1,
      }),
    );
  });

  it('should trigger file input when Enter key is pressed on drop area', async () => {
    const { getByRole, getByTestId } = renderWithUserEvent(
      <FileUploader data-testid="file-uploader" />,
    );
    const dropArea = getByRole('button');
    const input = getByTestId('file-uploader-input') as HTMLInputElement;
    const mockClick = jest.spyOn(input, 'click').mockImplementation(() => {
      // Mock implementation for testing keyboard navigation
    });

    await userEvent.type(dropArea, '{Enter}');

    expect(mockClick).toHaveBeenCalled();
    mockClick.mockRestore();
  });

  it('should trigger file input when Space key is pressed on drop area', async () => {
    const { getByRole, getByTestId } = renderWithUserEvent(
      <FileUploader data-testid="file-uploader" />,
    );
    const dropArea = getByRole('button');
    const input = getByTestId('file-uploader-input') as HTMLInputElement;
    const mockClick = jest.spyOn(input, 'click').mockImplementation(() => {
      // Mock implementation for testing keyboard navigation
    });

    await userEvent.type(dropArea, ' ');

    expect(mockClick).toHaveBeenCalled();
    mockClick.mockRestore();
  });

  it('should handle drag over events for visual feedback', async () => {
    const { getByRole } = renderWithUserEvent(
      <FileUploader data-testid="file-uploader" />,
    );
    const dropArea = getByRole('button');

    const dragOverEvent = new Event('dragover', { bubbles: true });
    dropArea.dispatchEvent(dragOverEvent);

    expect(dropArea).toBeDefined();
  });

  it('should handle file drop events and trigger onChange', async () => {
    // Arrange
    const mockOnChange = jest.fn();
    const { getByRole } = renderWithUserEvent(
      <FileUploader data-testid="file-uploader" onChange={mockOnChange} />,
    );
    const dropArea = getByRole('button');
    const file = new File(['content'], 'dropped.txt', { type: 'text/plain' });

    // Clear initial onChange call
    mockOnChange.mockClear();

    // Act - Use fireEvent.drop with dataTransfer
    fireEvent.drop(dropArea, {
      dataTransfer: {
        files: [file],
        items: [
          {
            kind: 'file',
            type: file.type,
            getAsFile: () => file,
          },
        ],
      },
    });

    // Assert - onFileDrop function should be called and trigger onChange
    expect(mockOnChange).toHaveBeenCalled();
  });

  it('should handle drag leave events', () => {
    // Arrange
    const { getByRole } = render(<FileUploader data-testid="file-uploader" />);
    const dropArea = getByRole('button');

    // Act - Simulate dragenter then dragleave
    fireEvent.dragEnter(dropArea);
    fireEvent.dragLeave(dropArea);

    // Assert - Component should handle the event (no errors thrown)
    expect(dropArea).toBeDefined();
  });

  it('should remove file when delete button is clicked', async () => {
    const mockOnChange = jest.fn();
    const { getByTestId, getAllByRole } = renderWithUserEvent(
      <FileUploader data-testid="file-uploader" onChange={mockOnChange} />,
    );
    const input = getByTestId('file-uploader-input') as HTMLInputElement;
    const file1 = new File(['content1'], 'file1.txt', { type: 'text/plain' });
    const file2 = new File(['content2'], 'file2.txt', { type: 'text/plain' });

    await userEvent.upload(input, [file1, file2]);
    mockOnChange.mockClear();

    const deleteButtons = getAllByRole('button', { name: /delete/iu });
    const deleteButton = deleteButtons.find((btn) =>
      btn.getAttribute('aria-label')?.includes('delete'),
    );
    if (deleteButton) {
      await userEvent.click(deleteButton);
    }

    expect(mockOnChange).toHaveBeenCalledWith(
      expect.objectContaining({
        length: 1,
      }),
    );
  });

  it('should validate files separately - reject invalid, accept valid', async () => {
    const mockOnChange = jest.fn();
    const { getByTestId } = renderWithUserEvent(
      <FileUploader
        data-testid="file-uploader"
        accept="text/plain"
        onChange={mockOnChange}
      />,
    );
    const input = getByTestId('file-uploader-input') as HTMLInputElement;
    const validFile = new File(['content'], 'valid.txt', {
      type: 'text/plain',
    });
    const invalidFile = new File(['content'], 'invalid.pdf', {
      type: 'application/pdf',
    });

    // Clear initial onChange call
    mockOnChange.mockClear();

    // Upload invalid file first, then valid file
    await userEvent.upload(input, invalidFile);
    await userEvent.upload(input, validFile);

    // Should call onChange for valid file
    expect(mockOnChange).toHaveBeenCalledWith(
      expect.objectContaining({
        0: expect.objectContaining({
          name: 'valid.txt',
          type: 'text/plain',
        }),
        length: 1,
      }),
    );
  });

  it('should add new files to existing files when multiple is enabled', async () => {
    const mockOnChange = jest.fn();
    const { getByTestId } = renderWithUserEvent(
      <FileUploader data-testid="file-uploader" onChange={mockOnChange} />,
    );
    const input = getByTestId('file-uploader-input') as HTMLInputElement;
    const file1 = new File(['content1'], 'file1.txt', { type: 'text/plain' });
    const file2 = new File(['content2'], 'file2.txt', { type: 'text/plain' });

    await userEvent.upload(input, file1);
    await userEvent.upload(input, file2);

    expect(mockOnChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ length: 2 }),
    );
  });
});
