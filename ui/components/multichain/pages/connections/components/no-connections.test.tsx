import React from 'react';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers-navigate';
import mockState from '../../../../../../test/data/mock-state.json';
import configureStore from '../../../../../store/store';
import { NoConnectionContent } from './no-connection';

const store = configureStore({
  ...mockState,
  metamask: {
    ...mockState.metamask,
  },
});

describe('No Connections Content', () => {
  const render = () => {
    return renderWithProvider(<NoConnectionContent />, store);
  };
  it('should render correctly', () => {
    const { container } = render();
    expect(container).toMatchSnapshot();
  });
});
