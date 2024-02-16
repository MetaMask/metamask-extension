import React from 'react';
import configureStore from '../../../../../store/store';
import mockState from '../../../../../../test/data/mock-state.json';
import { fireEvent, renderWithProvider } from '../../../../../../test/jest';
import { SendPageAccountPicker } from '.';

const render = (props = {}) => {
  const store = configureStore({
    ...mockState,
    activeTab: {
      origin: 'https://test.dapp',
    },
  });
  return renderWithProvider(<SendPageAccountPicker {...props} />, store);
};

describe('SendPageAccountPicker', () => {
  describe('render', () => {
    it('renders correctly', () => {
      const { container, getByTestId } = render();
      expect(container).toMatchSnapshot();

      expect(getByTestId('send-page-account-picker')).toBeInTheDocument();
    });
  });

  describe('actions', () => {
    it('opens account picker when clicked', () => {
      const { getByTestId } = render();
      fireEvent.click(getByTestId('send-page-account-picker'));
      expect(
        document.querySelector('.multichain-account-menu-popover'),
      ).toBeInTheDocument();
    });
  });
});
