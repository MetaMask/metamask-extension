import { render, fireEvent } from '@testing-library/react';
import React from 'react';
import NoteToTrader from './note-to-trader';

describe('NoteToTrader', () => {
  it('should render the Note to trader component', () => {
    const props = {
      placeholder: '',
      maxLength: 280,
      noteText: 'some text',
      labelText: 'Transaction note',
      onChange: jest.fn(),
    };

    const { getByTestId, container } = render(<NoteToTrader {...props} />);
    const transactionNoteInput = getByTestId(
      'transaction-note',
    ) as HTMLInputElement;

    fireEvent.change(transactionNoteInput);
    expect(transactionNoteInput.value).toBe('some text');
    expect(transactionNoteInput).toBeDefined();
    expect(container).toMatchSnapshot();
  });
});
