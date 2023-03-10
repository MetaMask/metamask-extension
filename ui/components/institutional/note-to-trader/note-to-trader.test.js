import { render } from '@testing-library/react';
import React from 'react';
import sinon from 'sinon';
import NoteToTrader from './note-to-trader';

describe('NoteToTrader', () => {
  it('should render the Note to trader component', () => {
    const props = {
      placeholder: '',
      maxLength: '280',
      noteText: 'some text',
      labelText: 'Transaction note',
      onChange: sinon.spy(),
    };

    const { getByTestId, container } = render(<NoteToTrader {...props} />);

    expect(getByTestId('transaction-note')).toBeDefined();
    expect(container).toMatchSnapshot();
  });
});
