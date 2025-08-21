import React from 'react';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import { GatorPermissionsPage } from './gator-permissions-page';

describe('Gator Permissions Page', () => {
  describe('render', () => {
    it('renders no connections message when user has no connections', () => {
      const { getByTestId } = renderWithProvider(<GatorPermissionsPage />);
      expect(getByTestId('no-connections')).toBeInTheDocument();
    });
  });
});
