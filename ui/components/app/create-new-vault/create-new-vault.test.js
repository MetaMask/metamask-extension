import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/jest';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import CreateNewVault from './create-new-vault';

const store = configureStore({
  metamask: {
    ...mockState.metamask,
  },
});

describe('CreateNewVault', () => {
  it('renders CreateNewVault component and shows Secret Recovery Phrase text', () => {
    renderWithProvider(<CreateNewVault submitText="Import" />, store);
    expect(screen.getByText('Secret Recovery Phrase')).toBeInTheDocument();
  });

  it('renders CreateNewVault component and shows You can paste... text', () => {
    renderWithProvider(
      <CreateNewVault submitText="Import" includeTerms />,
      store,
    );
    expect(
      screen.getByText(
        'You can paste your entire secret recovery phrase into any field',
      ),
    ).toBeInTheDocument();
  });
});
