import React from 'react';
import configureMockStore from 'redux-mock-store';
import mockState from '../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import OriginPill from './origin-pill';

describe('<OriginPill />', () => {
  it('renders', () => {
    const defaultProps = {
      origin: 'Test Origin',
      dataTestId: 'test-data-test-id',
    };

    const store = configureMockStore()(mockState);
    const { container } = renderWithProvider(
      <OriginPill {...defaultProps} />,
      store,
    );

    expect(container).toMatchSnapshot();
  });
});
