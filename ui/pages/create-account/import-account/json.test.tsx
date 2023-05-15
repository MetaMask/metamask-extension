import React from 'react';
import configureMockStore from 'redux-mock-store';
import { fireEvent, waitFor } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import mockState from '../../../../test/data/mock-state.json';
import messages from '../../../../app/_locales/en/messages.json';
import Json from './json';

const mockImportFunc = jest.fn();
describe('Json', () => {
  const mockStore = configureMockStore()(mockState);
  it('should match snapshot', () => {
    const { asFragment } = renderWithProvider(
      <Json importAccountFunc={mockImportFunc} />,
      mockStore,
    );
    expect(asFragment()).toMatchSnapshot();
  });

  it('should render', () => {
    const { getByText, getByRole } = renderWithProvider(
      <Json importAccountFunc={mockImportFunc} />,
      mockStore,
    );
    const passwordToggle = getByRole('checkbox');
    expect(passwordToggle).toBeInTheDocument();

    const fileImportLink = getByText('File import not working? Click here!');
    expect(fileImportLink).toBeInTheDocument();
  });

  it('should import file without password when toggle is enabled', async () => {
    const { getByText, getByRole, getByTestId } = renderWithProvider(
      <Json importAccountFunc={mockImportFunc} />,
      mockStore,
    );

    const importButton = getByText('Import');
    const fileInput = getByTestId('file-input');

    const mockFile = new File(['0'], 'test.json');
    fireEvent.change(fileInput, {
      target: { files: [mockFile] },
    });

    expect(importButton).toBeInTheDocument();
    expect(importButton).toBeDisabled();

    const passwordToggle = getByRole('checkbox');
    fireEvent.click(passwordToggle);

    await waitFor(() => {
      expect(passwordToggle).toBeChecked();
      expect(importButton).not.toBeDisabled();
    });

    fireEvent.click(importButton);

    await waitFor(() => {
      expect(mockImportFunc).toHaveBeenCalledWith('JSON File', ['0', '']);
    });
  });

  it('should import file with password when toggle is disabled', async () => {
    const { getByText, getByRole, getByTestId, getByPlaceholderText } =
      renderWithProvider(
        <Json importAccountFunc={mockImportFunc} />,
        mockStore,
      );

    const importButton = getByText('Import');
    const fileInput = getByTestId('file-input');

    const mockFile = new File(['0'], 'test.json');
    fireEvent.change(fileInput, {
      target: { files: [mockFile] },
    });

    expect(importButton).toBeInTheDocument();
    expect(importButton).toBeDisabled();

    const passwordToggle = getByRole('checkbox');

    const passwordInput = getByPlaceholderText(messages.enterPassword.message);
    fireEvent.change(passwordInput, {
      target: { value: 'password' },
    });

    await waitFor(() => {
      expect(passwordToggle).not.toBeChecked();
      expect(importButton).not.toBeDisabled();
    });

    fireEvent.click(importButton);

    await waitFor(() => {
      expect(mockImportFunc).toHaveBeenCalledWith('JSON File', [
        '0',
        'password',
      ]);
    });
  });
});
