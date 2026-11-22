import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import mockState from '../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { toast } from '../../../components/ui/toast/toast';
import { setBackgroundConnection } from '../../../store/background-connection';
import DeveloperToolsTab from './developer-tools-tab';

jest.mock('../../../components/ui/toast/toast', () => ({
  toast: {
    success: jest.fn(),
  },
}));

const backgroundConnectionMock = new Proxy(
  {},
  { get: () => jest.fn().mockResolvedValue(undefined) },
);

describe('DeveloperToolsTab', () => {
  const mockStore = configureMockStore([thunk])(mockState);

  beforeEach(() => {
    jest.clearAllMocks();
    setBackgroundConnection(backgroundConnectionMock as never);
  });

  describe('snapshot', () => {
    it('matches snapshot', () => {
      const { container } = renderWithProvider(
        <DeveloperToolsTab />,
        mockStore,
      );

      expect(container).toMatchSnapshot();
    });
  });

  it('shows a success toast after deleting activity and nonce data', async () => {
    renderWithProvider(<DeveloperToolsTab />, mockStore);

    fireEvent.click(
      screen.getByTestId('developer-options-delete-activity-and-nonce-data'),
    );
    fireEvent.click(
      screen.getByTestId('delete-activity-and-nonce-data-button'),
    );

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        'Activity and nonce data deleted',
      );
    });
  });
});
