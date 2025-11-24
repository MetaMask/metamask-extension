import React from 'react';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers';
import mockState from '../../../../../../test/data/mock-state.json';
import configureStore from '../../../../../store/store';
import { ReviewGatorPermissionsPage } from './review-gator-permissions-page';

const store = configureStore({
  ...mockState,
  metamask: {
    ...mockState.metamask,
  },
});

describe('Review Gator Permissions Page', () => {
  describe('render', () => {
    it('renders correctly', () => {
      const { container, getByTestId } = renderWithProvider(
        <ReviewGatorPermissionsPage />,
        store,
      );
      expect(container).toMatchSnapshot();

      expect(getByTestId('review-gator-permissions-page')).toBeInTheDocument();
    });
  });
});
