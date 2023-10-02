import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import AddNetworkModal from '.';

const mockHideModal = jest.fn();
jest.mock('../../../store/actions', () => ({
  ...jest.requireActual('../../../store/actions'),
  hideModal: () => mockHideModal,
}));

describe('Add Network Modal', () => {
  it('should render', async () => {
    const mockStore = configureMockStore([])({
      metamask: { useSafeChainsListValidation: true },
    });

    const { container } = renderWithProvider(<AddNetworkModal />, mockStore);

    await waitFor(() => {
      expect(container).toMatchSnapshot();
    });
  });

  it('should handle callback', async () => {
    const mockStore = configureMockStore([thunk])({
      metamask: { useSafeChainsListValidation: true },
    });

    const { queryByText } = renderWithProvider(<AddNetworkModal />, mockStore);

    const cancelButton = queryByText('Cancel');
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(mockHideModal).toHaveBeenCalledTimes(1);
    });
  });
});
