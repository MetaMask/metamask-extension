import React from 'react';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import { GatorPermissionsPage } from './gator-permissions-page';

describe('Gator Permissions Page', () => {
  describe('render', () => {
    it('renders Gator Permissions page title', () => {
      const { getByTestId } = renderWithProvider(<GatorPermissionsPage />);
      expect(getByTestId('gator-permissions-page-title')).toBeInTheDocument();
    });
  });
});
