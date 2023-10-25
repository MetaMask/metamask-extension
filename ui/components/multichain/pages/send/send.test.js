import React from 'react';
import configureStore from '../../../../store/store';
import mockState from '../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import { SendPage } from '.';

const store = configureStore(mockState);

describe('SendPage', () => {
  describe('render', () => {
    it('renders correctly', () => {
      const { container, getByTestId } = renderWithProvider(
        <SendPage />,
        store,
      );
      expect(container).toMatchSnapshot();

      expect(getByTestId('send-page-network-picker')).toBeInTheDocument();
    });
  });
});
