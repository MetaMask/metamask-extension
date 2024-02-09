import React from 'react';
import configureMockStore from 'redux-mock-store';
import mockStore from '../../../../../test/data/mock-state.json';
import {
  fireEvent,
  renderWithProvider,
  waitFor,
} from '../../../../../test/jest';
import KeyringSnapRemovalResult from './keyring-snap-removal-result-modal';

const mockOnClose = jest.fn();

const defaultArgs = {
  isOpen: true,
  onClose: mockOnClose,
};

const getStoreWithModalData = ({
  snapName,
  result,
}: {
  snapName: string;
  result: 'success' | 'failed';
}) => {
  return configureMockStore()({
    ...mockStore,

    appState: {
      ...mockStore.appState,
      keyringRemovalSnapModal: {
        snapName,
        result,
      },
    },
  });
};

describe('Keyring Snap Remove Result', () => {
  it('show render the success message', async () => {
    const { getByText, getByLabelText } = renderWithProvider(
      <KeyringSnapRemovalResult {...defaultArgs} />,
      getStoreWithModalData({ snapName: 'mock-snap', result: 'success' }),
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
      <KeyringSnapRemovalResult {...defaultArgs} />,
      getStoreWithModalData({ snapName: 'mock-snap', result: 'failed' }),
    );
    expect(getByText('mock-snap not removed')).toBeInTheDocument();
  });
});
