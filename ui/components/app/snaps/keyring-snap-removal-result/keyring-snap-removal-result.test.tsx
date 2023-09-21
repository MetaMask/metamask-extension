import React from 'react';
import configureMockStore from 'redux-mock-store';
import mockStore from '../../../../../test/data/mock-state.json';
import {
  fireEvent,
  renderWithProvider,
  waitFor,
} from '../../../../../test/jest';
import KeyringSnapRemovalResult from './keyring-snap-removal-result';

const mockOnClose = jest.fn();

const defaultArgs = {
  isOpen: true,
  snapName: 'mock-snap',
  result: 'success',
  onClose: mockOnClose,
};

describe('Keyring Snap Remove Result', () => {
  let store;
  beforeAll(() => {
    store = configureMockStore()(mockStore);
  });
  it('show render the success message', async () => {
    const { getByText, getByLabelText } = renderWithProvider(
      <KeyringSnapRemovalResult {...defaultArgs} />,
      store,
    );

    expect(getByText('mock-snap removed')).toBeInTheDocument();

    const closeButton = getByLabelText('Close');

    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
    });
  });
  it('show render the failure message', () => {
    const { getByText } = renderWithProvider(
      <KeyringSnapRemovalResult {...defaultArgs} result="failed" />,
      store,
    );
    expect(getByText('mock-snap not removed')).toBeInTheDocument();
  });
});
