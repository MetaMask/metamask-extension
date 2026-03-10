import { fireEvent, screen } from '@testing-library/react';
import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import mockState from '../../../../test/data/mock-state.json';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import type { MetaMaskReduxState } from '../../../store/store';
import { createSelectItem, SelectItemConfig } from './create-select-item';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const createMockStore = (overrides = {}) =>
  configureMockStore([thunk])({
    ...mockState,
    metamask: {
      ...mockState.metamask,
      testSelectValue: 'test-value',
      ...overrides,
    },
  });

const testConfig: SelectItemConfig = {
  name: 'TestSelectItem',
  titleKey: 'theme',
  valueSelector: (state: MetaMaskReduxState) =>
    (state.metamask as Record<string, unknown>).testSelectValue as string,
  route: '/test-route',
};

const TestSelectItem = createSelectItem(testConfig);

describe('createSelectItem', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders label from translation key', () => {
    const mockStore = createMockStore();
    renderWithProvider(<TestSelectItem />, mockStore);

    expect(screen.getByText(messages.theme.message)).toBeInTheDocument();
  });

  it('renders value from selector', () => {
    const mockStore = createMockStore({ testSelectValue: 'my-value' });
    renderWithProvider(<TestSelectItem />, mockStore);

    expect(screen.getByText('my-value')).toBeInTheDocument();
  });

  it('navigates to route on press', () => {
    const mockStore = createMockStore();
    renderWithProvider(<TestSelectItem />, mockStore);

    fireEvent.click(screen.getByRole('button'));

    expect(mockNavigate).toHaveBeenCalledWith('/test-route');
  });

  it('applies formatValue when provided', () => {
    const configWithFormatter: SelectItemConfig = {
      ...testConfig,
      formatValue: (value) => value.toUpperCase(),
    };

    const TestSelectWithFormatter = createSelectItem(configWithFormatter);
    const mockStore = createMockStore({ testSelectValue: 'lowercase' });

    renderWithProvider(<TestSelectWithFormatter />, mockStore);

    expect(screen.getByText('LOWERCASE')).toBeInTheDocument();
  });

  it('supports translation in formatValue', () => {
    const configWithTranslation: SelectItemConfig = {
      ...testConfig,
      formatValue: (_value, t) => t('darkTheme'),
    };

    const TestSelectWithTranslation = createSelectItem(configWithTranslation);
    const mockStore = createMockStore();

    renderWithProvider(<TestSelectWithTranslation />, mockStore);

    expect(screen.getByText(messages.darkTheme.message)).toBeInTheDocument();
  });

  it('sets displayName from config name', () => {
    expect(TestSelectItem.displayName).toBe('TestSelectItem');
  });
});
