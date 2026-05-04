import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import mockState from '../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import type { SettingsV2SearchResult } from '../useSettingsV2Search';
import { SettingsV2SearchResults } from './settings-v2-search-results';

const createMockStore = () => configureMockStore([thunk])(mockState);

const mockItems: SettingsV2SearchResult[] = [
  {
    settingId: 'local-currency',
    tabLabelKey: 'preferencesAndDisplay',
    titleKey: 'localCurrency',
    tabRoute: '/settings-v2/preferences-and-display',
    iconName: 'Customize',
  },
  {
    settingId: 'theme',
    tabLabelKey: 'preferencesAndDisplay',
    titleKey: 'theme',
    tabRoute: '/settings-v2/preferences-and-display',
    iconName: 'Customize',
  },
];

describe('SettingsV2SearchResults', () => {
  it('renders search result items', () => {
    renderWithProvider(
      <SettingsV2SearchResults results={mockItems} onClickResult={jest.fn()} />,
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

  it('calls onClickResult when a result is clicked', () => {
    const onClickResult = jest.fn();
    renderWithProvider(
      <SettingsV2SearchResults
        results={mockItems}
        onClickResult={onClickResult}
      />,
      createMockStore(),
    );

    const items = screen.getAllByTestId('settings-v2-search-result-item');
    fireEvent.click(items[0]);

    expect(onClickResult).toHaveBeenCalledWith(mockItems[0]);
  });

  it('shows no-match message and request link when results are empty', () => {
    renderWithProvider(
      <SettingsV2SearchResults results={[]} onClickResult={jest.fn()} />,
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
