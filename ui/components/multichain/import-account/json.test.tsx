import React from 'react';
import configureMockStore from 'redux-mock-store';
import { fireEvent, waitFor } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import mockState from '../../../../test/data/mock-state.json';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import Json from './json';

const mockImportFunc = jest.fn();
const mockOnActionComplete = jest.fn();

describe('Json', () => {
  const mockStore = configureMockStore()(mockState);

  it('should render', () => {
    const { getByText } = renderWithProvider(
      <Json
        importAccountFunc={mockImportFunc}
        onActionComplete={mockOnActionComplete}
      />,
      mockStore,
    );

    expect(
      getByText(messages.fileImportNotWorking.message),
    ).toBeInTheDocument();
    expect(
      getByText(messages.clickHere.message).closest('a'),
    ).toBeInTheDocument();
    expect(getByText(messages.chooseJsonFile.message)).toBeInTheDocument();
  });

  it('should import file without password', async () => {
    const { getByRole, getByTestId } = renderWithProvider(
      <Json
        importAccountFunc={mockImportFunc}
        onActionComplete={mockOnActionComplete}
      />,
      mockStore,
    );

    const importButton = getByRole('button', {
      name: messages.import.message,
    });
    const fileInput = getByTestId('file-input');

    const mockFile = new File(['0'], 'test.json');

    expect(importButton).toBeInTheDocument();
    expect(importButton).toBeDisabled();

    fireEvent.change(fileInput, {
      target: { files: [mockFile] },
    });

    await waitFor(() => {
      expect(importButton).not.toBeDisabled();
    });

    fireEvent.click(importButton);

    await waitFor(() => {
      expect(mockImportFunc).toHaveBeenCalledWith('json', ['0', '']);
    });
  });

  it('should import file with password', async () => {
    const { getByRole, getByTestId, getByPlaceholderText } = renderWithProvider(
      <Json
        importAccountFunc={mockImportFunc}
        onActionComplete={mockOnActionComplete}
      />,
      mockStore,
    );

    const importButton = getByRole('button', {
      name: messages.import.message,
    });
    const fileInput = getByTestId('file-input');

    const mockFile = new File(['0'], 'test.json');

    expect(importButton).toBeInTheDocument();
    expect(importButton).toBeDisabled();

    const passwordInput = getByPlaceholderText(
      messages.enterOptionalPassword.message,
    );
    fireEvent.change(passwordInput, {
      target: { value: 'password' },
    });

    fireEvent.change(fileInput, {
      target: { files: [mockFile] },
    });

    await waitFor(() => {
      expect(importButton).not.toBeDisabled();
    });

    fireEvent.click(importButton);

    await waitFor(() => {
      expect(mockImportFunc).toHaveBeenCalledWith('json', ['0', 'password']);
    });
  });

  it('shows a missing or incorrect password under the password field', () => {
    const { getByLabelText, getByTestId, getByText } = renderWithProvider(
      <Json
        importAccountFunc={mockImportFunc}
        onActionComplete={mockOnActionComplete}
        importErrorMessage={messages.jsonImportPasswordError.message}
      />,
      mockStore,
    );

    expect(getByText(messages.jsonImportPasswordError.message)).toHaveAttribute(
      'id',
      'json-password-error',
    );
    expect(
      getByLabelText(messages.enterOptionalPassword.message),
    ).toHaveAttribute('aria-describedby', 'json-password-error');
    expect(
      getByLabelText(messages.enterOptionalPassword.message),
    ).toHaveAttribute('aria-invalid', 'true');
    expect(getByTestId('file-input')).not.toHaveAttribute(
      'aria-invalid',
      'true',
    );
  });

  it('keeps a file error on the JSON file input', () => {
    const { getByTestId, getByText } = renderWithProvider(
      <Json
        importAccountFunc={mockImportFunc}
        onActionComplete={mockOnActionComplete}
        importErrorMessage="Not a V3 wallet"
      />,
      mockStore,
    );

    expect(getByText('Not a V3 wallet')).toHaveAttribute(
      'id',
      'json-file-error',
    );
    expect(getByTestId('file-input')).toHaveAttribute(
      'aria-describedby',
      'json-file-error',
    );
    expect(getByTestId('file-input')).toHaveAttribute('aria-invalid', 'true');
  });
});
