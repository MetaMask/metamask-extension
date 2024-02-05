import React from 'react';
import configureStore from '../../../../../store/store';
import mockState from '../../../../../../test/data/mock-state.json';
import { fireEvent, renderWithProvider } from '../../../../../../test/jest';
import { SendPageNetworkPicker } from '.';

const mockToggleNetworkMenu = jest.fn();
jest.mock('../../../../../store/actions.ts', () => ({
  toggleNetworkMenu: () => mockToggleNetworkMenu,
}));

const render = (props = {}) => {
  const store = configureStore({
    ...mockState,
    activeTab: {
      origin: 'https://test.dapp',
    },
  });
  return renderWithProvider(<SendPageNetworkPicker {...props} />, store);
};

describe('SendPageNetworkPicker', () => {
  describe('render', () => {
    it('renders correctly', () => {
      const { container, getByTestId } = render();
      expect(container).toMatchSnapshot();

      expect(getByTestId('send-page-network-picker')).toBeInTheDocument();
    });
  });

  describe('actions', () => {
    it('opens network picker when clicked', () => {
      const { getByTestId } = render();
      fireEvent.click(getByTestId('send-page-network-picker'));
      expect(mockToggleNetworkMenu).toHaveBeenCalled();
    });
  });
});
