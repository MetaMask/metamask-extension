import { fireEvent } from '@testing-library/react';
import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { renderWithConfirmContextProvider } from '../../../../test/lib/confirmations/render-helpers';
import mockState from '../../../../test/data/mock-state.json';
import NoteToTrader from './note-to-trader';

jest.mock('../../../selectors/institutional/selectors', () => ({
  getIsNoteToTraderSupported: () => true,
}));

const middleware = [thunk];
const store = configureMockStore(middleware)(mockState);

describe('NoteToTrader', () => {
  it('should render the Note to trader component', () => {
    const { getByTestId, container } = renderWithConfirmContextProvider(
      <NoteToTrader />,
      store,
    );

    const transactionNoteInput = getByTestId(
      'transaction-note',
    ) as HTMLInputElement;

    fireEvent.change(transactionNoteInput);
    expect(transactionNoteInput.value).toBe('');
    expect(transactionNoteInput).toBeDefined();
    expect(container).toMatchSnapshot();
  });
});
