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
  // Set the environment variable before tests run
  beforeEach(() => {
    process.env.ENABLE_NETWORK_UI_REDESIGN = '';
  });

  // Reset the environment variable after tests complete
  afterEach(() => {
    delete process.env.ENABLE_NETWORK_UI_REDESIGN;
  });

  it('should render', async () => {
    const mockStore = configureMockStore([])({
      metamask: { useSafeChainsListValidation: true },
    });

    const { container } = renderWithProvider(
      <AddNetworkModal newNetworkMenuDesignActive={false} />,
      mockStore,
    );

    await waitFor(() => {
      expect(container).toMatchSnapshot();
    });
  });

  it('should handle callback', async () => {
    const mockStore = configureMockStore([thunk])({
      metamask: { useSafeChainsListValidation: true },
    });

    const { queryByText } = renderWithProvider(
      <AddNetworkModal newNetworkMenuDesignActive={false} />,
      mockStore,
    );

    const cancelButton = queryByText('Cancel');
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(mockHideModal).toHaveBeenCalledTimes(1);
    });
  });

  it('should not render the new network flow modal', async () => {
    const mockStore = configureMockStore([thunk])({
      metamask: { useSafeChainsListValidation: true },
    });

    const { queryByText } = renderWithProvider(
      <AddNetworkModal newNetworkMenuDesignActive />,
      mockStore,
    );

    await waitFor(() => {
      expect(queryByText('Cancel')).not.toBeInTheDocument();
      expect(queryByText('Save')).toBeInTheDocument();
    });
  });
});
