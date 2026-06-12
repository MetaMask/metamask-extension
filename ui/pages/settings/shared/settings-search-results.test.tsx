import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import mockState from '../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { enLocale as messages, tEn } from '../../../../test/lib/i18n-helpers';
import type { SettingsSearchResult } from '../useSettingsSearch';
import { SettingsSearchResults } from './settings-search-results';

jest.mock('../../../../shared/lib/passkey', () => ({
  getPasskeyAuthMethodKey: () => 'passkeyAuthMethodBiometrics',
}));

const createMockStore = () => configureMockStore([thunk])(mockState);

const mockItems: SettingsSearchResult[] = [
  {
    settingId: 'local-currency',
    tabLabelKey: 'preferencesAndDisplay',
    titleKey: 'localCurrency',
    tabRoute: '/settings/preferences-and-display',
    iconName: 'Customize',
  },
  {
    settingId: 'theme',
    tabLabelKey: 'preferencesAndDisplay',
    titleKey: 'theme',
    tabRoute: '/settings/preferences-and-display',
    iconName: 'Customize',
  },
];

describe('SettingsSearchResults', () => {
  it('renders search result items', () => {
    renderWithProvider(
      <SettingsSearchResults results={mockItems} onClickResult={jest.fn()} />,
      createMockStore(),
    );

    expect(
      screen.getByText(
        `${messages.preferencesAndDisplay.message} > ${messages.localCurrency.message}`,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        `${messages.preferencesAndDisplay.message} > ${messages.theme.message}`,
      ),
    ).toBeInTheDocument();
  });

  it('resolves passkey title keys with auth-method substitution', () => {
    const passkeyItem: SettingsSearchResult = {
      settingId: 'passkey',
      tabLabelKey: 'securityAndPassword',
      titleKey: 'unlockWithPasskey',
      tabRoute: '/settings/security-and-password',
      iconName: 'SecurityKey',
    };

    renderWithProvider(
      <SettingsSearchResults
        results={[passkeyItem]}
        onClickResult={jest.fn()}
      />,
      createMockStore(),
    );

    expect(
      screen.getByText(
        `${messages.securityAndPassword.message} > ${tEn('unlockWithPasskey', [tEn('passkeyAuthMethodBiometrics')])}`,
      ),
    ).toBeInTheDocument();
  });

  it('calls onClickResult when a result is clicked', () => {
    const onClickResult = jest.fn();
    renderWithProvider(
      <SettingsSearchResults
        results={mockItems}
        onClickResult={onClickResult}
      />,
      createMockStore(),
    );

    const items = screen.getAllByTestId('settings-search-result-item');
    fireEvent.click(items[0]);

    expect(onClickResult).toHaveBeenCalledWith(mockItems[0]);
  });

  it('shows no-match message and request link when results are empty', () => {
    renderWithProvider(
      <SettingsSearchResults results={[]} onClickResult={jest.fn()} />,
      createMockStore(),
    );

    expect(
      screen.getByText(messages.settingsSearchMatchingNotFound.message),
    ).toBeInTheDocument();
    expect(
      screen.getByText(messages.settingsSearchRequestHere.message),
    ).toBeInTheDocument();

    const link = screen.getByText(messages.settingsSearchRequestHere.message);
    expect(link.tagName).toBe('A');
    expect(link).toHaveAttribute('target', '_blank');
  });
});
