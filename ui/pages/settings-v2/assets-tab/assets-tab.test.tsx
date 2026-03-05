import { screen } from '@testing-library/react';
import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import mockState from '../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { setBackgroundConnection } from '../../../store/background-connection';
import AssetsWithList, { Assets } from './assets-tab';

const backgroundConnectionMock = new Proxy(
  {},
  { get: () => jest.fn().mockResolvedValue(undefined) },
);

describe('Assets Tab', () => {
  const mockStore = configureMockStore([thunk])(mockState);

  beforeEach(() => {
    jest.clearAllMocks();
    setBackgroundConnection(backgroundConnectionMock as never);
  });

  describe('snapshot', () => {
    it('matches snapshot', () => {
      const { container } = renderWithProvider(<AssetsWithList />, mockStore);

      expect(container).toMatchSnapshot();
    });
  });

  describe('Assets component', () => {
    it('renders all items passed as children', () => {
      const MockItem1 = () => <div data-testid="mock-item-1">Item 1</div>;
      const MockItem2 = () => <div data-testid="mock-item-2">Item 2</div>;
      const MockItem3 = () => <div data-testid="mock-item-3">Item 3</div>;

      const mockItems = [
        { id: 'item-1', component: MockItem1 },
        { id: 'item-2', component: MockItem2 },
        { id: 'item-3', component: MockItem3 },
      ];

      renderWithProvider(<Assets>{mockItems}</Assets>, mockStore);

      expect(screen.getByTestId('mock-item-1')).toBeInTheDocument();
      expect(screen.getByTestId('mock-item-2')).toBeInTheDocument();
      expect(screen.getByTestId('mock-item-3')).toBeInTheDocument();
    });
  });
});
