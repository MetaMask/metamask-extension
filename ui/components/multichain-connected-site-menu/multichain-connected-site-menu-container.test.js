import React from 'react';
import { renderWithProvider } from '../../../test/jest';
import configureStore from '../../store/store';
import mockState from '../../../test/data/mock-state.json';
import { MultichainConnectedSiteMenu } from './multichain-connected-site-menu.component';

describe('Multichain Connected Site Menu', () => {
  it('should match snapshot', () => {
    const store = configureStore({
      metamask: {
        ...mockState.metamask,
      },
    });
    const { container } = renderWithProvider(
      <MultichainConnectedSiteMenu />,
      store,
    );

    expect(container).toMatchSnapshot();
  });
});
