import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import { userEvent } from '@testing-library/user-event';
import { renderWithProvider } from '../../../test/lib/render-helpers-navigate';
import mockState from '../../../test/data/mock-state.json';
import SrpInputForm from '.';

const TEST_SEED =
  'debris dizzy just program just float decrease vacant alarm reduce speak stadium';

describe('SrpInputForm', () => {
  const mockSetSecretRecoveryPhrase = jest.fn();
  const mockOnClearCallback = jest.fn();
  const store = configureMockStore()(mockState);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('render matches snapshot', () => {
    const { container } = renderWithProvider(
      <SrpInputForm
        setSecretRecoveryPhrase={mockSetSecretRecoveryPhrase}
        onClearCallback={mockOnClearCallback}
      />,
      store,
    );
    expect(container).toMatchSnapshot();
  });

  it('should render text and info button', () => {
    const { getByText, getByLabelText } = renderWithProvider(
      <SrpInputForm
        setSecretRecoveryPhrase={mockSetSecretRecoveryPhrase}
        onClearCallback={mockOnClearCallback}
      />,
      store,
    );

    expect(getByText('Enter your Secret Recovery Phrase')).toBeInTheDocument();

    const infoButton = getByLabelText('info');
    expect(infoButton).toBeInTheDocument();
  });

  it('should handle pasting SRP and call setSecretRecoveryPhrase', async () => {
    const { queryByTestId } = renderWithProvider(
      <SrpInputForm
        setSecretRecoveryPhrase={mockSetSecretRecoveryPhrase}
        onClearCallback={mockOnClearCallback}
      />,
      store,
    );

    const srpNote = queryByTestId('srp-input-import__srp-note');
    expect(srpNote).toBeInTheDocument();

    if (srpNote) {
      srpNote.focus();
      await userEvent.type(srpNote, TEST_SEED);
    }

    await waitFor(() => {
      expect(mockSetSecretRecoveryPhrase).toHaveBeenCalled();
    });
  });

  it('should clear SRP and call onClearCallback when clear button is clicked', async () => {
    const { queryByTestId, getByText } = renderWithProvider(
      <SrpInputForm
        setSecretRecoveryPhrase={mockSetSecretRecoveryPhrase}
        onClearCallback={mockOnClearCallback}
      />,
      store,
    );

    const srpNote = queryByTestId('srp-input-import__srp-note');
    expect(srpNote).toBeInTheDocument();

    // First, enter some text
    if (srpNote) {
      srpNote.focus();
      await userEvent.type(srpNote, TEST_SEED);
    }

    // Wait for the clear button to appear
    await waitFor(() => {
      const clearButton = getByText('Clear all');
      expect(clearButton).toBeInTheDocument();

      // Click the clear button
      if (clearButton) {
        fireEvent.click(clearButton);
      }
    });

    // Verify the clear callback was called
    await waitFor(() => {
      expect(mockOnClearCallback).toHaveBeenCalled();
    });
  });
});
