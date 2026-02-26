import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import mockStore from '../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../../../test/lib/i18n-helpers';
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

    const closeButton = getByLabelText(messages.close.message);

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
