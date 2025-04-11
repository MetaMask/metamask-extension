import { fireEvent } from '@testing-library/react';
import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import BetaHeader from '.';
import mockState from '../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../test/lib/render-helpers';

const mockHideBetaHeader = jest.fn();

jest.mock('../../../store/actions', () => {
  return {
    hideBetaHeader: () => {
      mockHideBetaHeader();
    },
  };
});

describe('Beta Header', () => {
  let store;

  beforeEach(() => {
    store = configureMockStore([thunk])(mockState);
  });

  afterEach(() => {
    mockHideBetaHeader.mockClear();
  });

  it('should match snapshot', () => {
    const { container } = renderWithProvider(<BetaHeader />, store);
    expect(container).toMatchSnapshot();
  });

  describe('Beta Header', () => {
    it('gets hidden when close button is clicked', () => {
      const { queryByTestId } = renderWithProvider(<BetaHeader />, store);

      const closeButton = queryByTestId('beta-header-close');
      fireEvent.click(closeButton);

      expect(mockHideBetaHeader).toHaveBeenCalledTimes(1);
    });
  });
});
