import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import mockState from '../../../../test/data/mock-state.json';

import { renderWithProvider } from '../../../../test/jest/rendering';

import { SelectActionModal } from '.';

describe('Select Action Modal', () => {
  const store = configureMockStore([thunk])(mockState);

  it('should render correctly', () => {
    const { container, getByTestId } = renderWithProvider(
      <SelectActionModal />,
      store,
    );
    expect(container).toMatchSnapshot();
    expect(getByTestId('select-action-modal')).toBeDefined();
  });
});
