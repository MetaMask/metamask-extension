import React from 'react';
import { waitFor } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import AddNetworkModal from '.';

const mockHideModal = jest.fn();
jest.mock('../../../store/actions', () => ({
  ...jest.requireActual('../../../store/actions'),
  hideModal: () => mockHideModal,
}));

const mockNetworkMenuRedesignToggle = jest.fn();

jest.mock('../../../helpers/utils/feature-flags', () => ({
  ...jest.requireActual('../../../helpers/utils/feature-flags'),
  getLocalNetworkMenuRedesignFeatureFlag: () => mockNetworkMenuRedesignToggle,
}));

describe('Add Network Modal', () => {
  it('should render', async () => {
    mockNetworkMenuRedesignToggle.mockImplementation(() => false);

    const mockStore = configureMockStore([])({
      metamask: { useSafeChainsListValidation: true, orderedNetworkList: {} },
    });

    const { container } = renderWithProvider(
      <AddNetworkModal showHeader />,
      mockStore,
    );

    await waitFor(() => {
      expect(container).toMatchSnapshot();
    });
  });

  it('should not render the new network flow modal', async () => {
    mockNetworkMenuRedesignToggle.mockReturnValue(true);

    const mockStore = configureMockStore([thunk])({
      metamask: { useSafeChainsListValidation: true, orderedNetworkList: {} },
    });

    const { queryByText } = renderWithProvider(
      <AddNetworkModal showHeader />,
      mockStore,
    );

    await waitFor(() => {
      expect(queryByText('Cancel')).not.toBeInTheDocument();
      expect(queryByText('Next')).toBeInTheDocument();
    });
  });
});
