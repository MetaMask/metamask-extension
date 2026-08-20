import React from 'react';
import { screen } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import mockState from '../../../../test/data/mock-state.json';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { MANAGE_WALLET_RECOVERY_ROUTE } from '../../../helpers/constants/routes';
import ManageWalletRecoveryItem from './manage-wallet-recovery-item';

const createMockStore = (overrides = {}) =>
  configureMockStore([thunk])({
    ...mockState,
    metamask: {
      ...mockState.metamask,
      ...overrides,
    },
  });

describe('ManageWalletRecoveryItem', () => {
  it('renders the label', () => {
    const store = createMockStore();
    renderWithProvider(
      <ManageWalletRecoveryItem route={MANAGE_WALLET_RECOVERY_ROUTE} />,
      store,
    );

    expect(
      screen.getByText(messages.manageWalletRecovery.message),
    ).toBeInTheDocument();
  });

  it('renders the arrow link to reveal SRP page', () => {
    const store = createMockStore();
    renderWithProvider(
      <ManageWalletRecoveryItem route={MANAGE_WALLET_RECOVERY_ROUTE} />,
      store,
    );

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', MANAGE_WALLET_RECOVERY_ROUTE);
  });

  it('shows "Back up incomplete" tag when SRP is not backed up', () => {
    const store = createMockStore({
      firstTimeFlowType: 'create',
      seedPhraseBackedUp: false,
    });
    renderWithProvider(
      <ManageWalletRecoveryItem route={MANAGE_WALLET_RECOVERY_ROUTE} />,
      store,
    );

    expect(screen.getByTestId('backup-incomplete-tag')).toBeInTheDocument();
    expect(
      screen.getByText(messages.backUpIncomplete.message),
    ).toBeInTheDocument();
  });

  it('hides "Back up incomplete" tag when SRP is backed up', () => {
    const store = createMockStore({
      firstTimeFlowType: 'create',
      seedPhraseBackedUp: true,
    });
    renderWithProvider(
      <ManageWalletRecoveryItem route={MANAGE_WALLET_RECOVERY_ROUTE} />,
      store,
    );

    expect(
      screen.queryByTestId('backup-incomplete-tag'),
    ).not.toBeInTheDocument();
  });

  it('hides "Back up incomplete" tag when flow type is import', () => {
    const store = createMockStore({
      firstTimeFlowType: 'import',
      seedPhraseBackedUp: false,
    });
    renderWithProvider(
      <ManageWalletRecoveryItem route={MANAGE_WALLET_RECOVERY_ROUTE} />,
      store,
    );

    expect(
      screen.queryByTestId('backup-incomplete-tag'),
    ).not.toBeInTheDocument();
  });
});
