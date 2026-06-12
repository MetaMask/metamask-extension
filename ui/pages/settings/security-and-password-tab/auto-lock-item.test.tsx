import React from 'react';
import { screen } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import mockState from '../../../../test/data/mock-state.json';
import { enLocale as messages, tEn } from '../../../../test/lib/i18n-helpers';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { AutoLockItem } from './security-and-password-tab';

const createMockStore = (autoLockTimeLimit?: number) =>
  configureMockStore([thunk])({
    ...mockState,
    metamask: {
      ...mockState.metamask,
      preferences: {
        ...mockState.metamask.preferences,
        ...(autoLockTimeLimit !== undefined && { autoLockTimeLimit }),
      },
    },
  });

describe('AutoLockItem', () => {
  it('renders the label', () => {
    renderWithProvider(<AutoLockItem />, createMockStore());

    expect(screen.getByText(messages.autoLock.message)).toBeInTheDocument();
  });

  it('displays "Never" when autoLockTimeLimit is 0', () => {
    renderWithProvider(<AutoLockItem />, createMockStore(0));

    expect(
      screen.getByText(messages.autoLockNever.message),
    ).toBeInTheDocument();
  });

  it('displays custom label when autoLockTimeLimit is 0.01', () => {
    renderWithProvider(<AutoLockItem />, createMockStore(0.01));

    expect(
      screen.getByText(tEn('autoLockAfterMinutes', ['0.01'])),
    ).toBeInTheDocument();
  });

  it('displays "After 5 minutes" when autoLockTimeLimit is 5', () => {
    renderWithProvider(<AutoLockItem />, createMockStore(5));

    expect(
      screen.getByText(messages.autoLockAfter5Minutes.message),
    ).toBeInTheDocument();
  });

  it('displays custom label for non-preset value', () => {
    renderWithProvider(<AutoLockItem />, createMockStore(10));

    expect(
      screen.getByText(tEn('autoLockAfterMinutes', ['10'])),
    ).toBeInTheDocument();
  });

  it('rounds long decimal custom label values', () => {
    renderWithProvider(<AutoLockItem />, createMockStore(0.1234242423));

    expect(
      screen.getByText(tEn('autoLockAfterMinutes', ['0.12'])),
    ).toBeInTheDocument();
  });

  it('links to the auto-lock sub-page', () => {
    renderWithProvider(<AutoLockItem />, createMockStore());

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute(
      'href',
      '/settings/security-and-password/auto-lock',
    );
  });
});
