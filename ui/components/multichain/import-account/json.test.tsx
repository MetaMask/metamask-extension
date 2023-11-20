import React from 'react';
import configureMockStore from 'redux-mock-store';
import { fireEvent, waitFor } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import mockState from '../../../../test/data/mock-state.json';
import messages from '../../../../app/_locales/en/messages.json';
import Json from './json';

const mockImportFunc = jest.fn();
const mockOnActionComplete = jest.fn();

describe('Json', () => {
  const mockStore = configureMockStore()(mockState);
  it('should match snapshot', () => {
    const { asFragment } = renderWithProvider(
      <Json
        importAccountFunc={mockImportFunc}
        onActionComplete={mockOnActionComplete}
      />,
      mockStore,
    );
    expect(asFragment()).toMatchSnapshot();
  });

  it('should render', () => {
    const { getByText } = renderWithProvider(
      <Json
        importAccountFunc={mockImportFunc}
        onActionComplete={mockOnActionComplete}
      />,
      mockStore,
    );

    const fileImportLink = getByText('File import not working? Click here!');
    expect(fileImportLink).toBeInTheDocument();
  });

  it('should import file without password', async () => {
    const { getByText, getByTestId } = renderWithProvider(
      <Json
        importAccountFunc={mockImportFunc}
        onActionComplete={mockOnActionComplete}
      />,
      mockStore,
    );

    const importButton = getByText('Import');
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
    const { getByText, getByTestId, getByPlaceholderText } = renderWithProvider(
      <Json
        importAccountFunc={mockImportFunc}
        onActionComplete={mockOnActionComplete}
      />,
      mockStore,
    );

    const importButton = getByText('Import');
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
});
