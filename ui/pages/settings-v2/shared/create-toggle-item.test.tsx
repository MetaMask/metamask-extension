import { fireEvent, screen } from '@testing-library/react';
import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import mockState from '../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import type { MetaMaskReduxState } from '../../../store/store';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { createToggleItem, ToggleItemConfig } from './create-toggle-item';

const mockAction = jest.fn((value: boolean) => ({
  type: 'MOCK_TOGGLE_ACTION',
  payload: value,
}));

const createMockStore = (overrides = {}) =>
  configureMockStore([thunk])({
    ...mockState,
    metamask: {
      ...mockState.metamask,
      testToggleValue: false,
      isDisabled: false,
      ...overrides,
    },
  });

const testConfig: ToggleItemConfig = {
  name: 'TestToggleItem',
  titleKey: 'cancel',
  descriptionKey: 'back',
  selector: (state: MetaMaskReduxState) =>
    (state.metamask as Record<string, unknown>).testToggleValue as boolean,
  action: mockAction,
  dataTestId: 'test-toggle',
};

const TestToggleItem = createToggleItem(testConfig);

describe('createToggleItem', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders title from translation key', () => {
    const mockStore = createMockStore();
    renderWithProvider(<TestToggleItem />, mockStore);

    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('renders description from translation key', () => {
    const mockStore = createMockStore();
    renderWithProvider(<TestToggleItem />, mockStore);

    expect(screen.getByText('Back')).toBeInTheDocument();
  });

  it('renders toggle with value from selector', () => {
    const mockStore = createMockStore({ testToggleValue: true });
    renderWithProvider(<TestToggleItem />, mockStore);

    expect(screen.getByTestId('test-toggle')).toHaveAttribute('value', 'true');
  });

  it('dispatches action with inverted value when toggled', () => {
    const mockStore = createMockStore({ testToggleValue: false });
    renderWithProvider(<TestToggleItem />, mockStore);

    fireEvent.click(screen.getByTestId('test-toggle'));

    expect(mockAction).toHaveBeenCalledWith(true);
  });

  it('dispatches action with false when toggling off', () => {
    const mockStore = createMockStore({ testToggleValue: true });
    renderWithProvider(<TestToggleItem />, mockStore);

    fireEvent.click(screen.getByTestId('test-toggle'));

    expect(mockAction).toHaveBeenCalledWith(false);
  });

  describe('with disabledSelector', () => {
    const configWithDisabled: ToggleItemConfig = {
      ...testConfig,
      dataTestId: 'test-toggle-with-disabled',
      disabledSelector: (state: MetaMaskReduxState) =>
        (state.metamask as Record<string, unknown>).isDisabled as boolean,
    };

    const TestToggleWithDisabled = createToggleItem(configWithDisabled);

    it('is enabled when disabledSelector returns false', () => {
      const mockStore = createMockStore({ isDisabled: false });
      renderWithProvider(<TestToggleWithDisabled />, mockStore);

      const toggle = screen.getByTestId('test-toggle-with-disabled');
      expect(
        toggle.closest('.toggle-button--disabled'),
      ).not.toBeInTheDocument();
    });

    it('is disabled when disabledSelector returns true', () => {
      const mockStore = createMockStore({ isDisabled: true });
      renderWithProvider(<TestToggleWithDisabled />, mockStore);

      const toggle = screen.getByTestId('test-toggle-with-disabled');
      expect(toggle.closest('.toggle-button--disabled')).toBeInTheDocument();
    });
  });

  it('sets displayName from config name', () => {
    expect(TestToggleItem.displayName).toBe('TestToggleItem');
  });

  describe('with trackEvent', () => {
    const mockTrackEvent = jest.fn();

    const configWithTracking: ToggleItemConfig = {
      ...testConfig,
      dataTestId: 'test-toggle-with-tracking',
      trackEvent: {
        event: MetaMetricsEventName.SettingsUpdated,
        properties: (newValue) => ({ settingName: 'testToggle', newValue }),
      },
    };

    const TestToggleWithTracking = createToggleItem(configWithTracking);

    const renderWithMetaMetrics = (store: ReturnType<typeof createMockStore>) =>
      renderWithProvider(
        <MetaMetricsContext.Provider
          value={{ trackEvent: mockTrackEvent } as never}
        >
          <TestToggleWithTracking />
        </MetaMetricsContext.Provider>,
        store,
      );

    beforeEach(() => {
      mockTrackEvent.mockClear();
    });

    it('tracks event when toggled', () => {
      const mockStore = createMockStore({ testToggleValue: false });
      renderWithMetaMetrics(mockStore);

      fireEvent.click(screen.getByTestId('test-toggle-with-tracking'));

      expect(mockTrackEvent).toHaveBeenCalledWith({
        category: MetaMetricsEventCategory.Settings,
        event: MetaMetricsEventName.SettingsUpdated,
        properties: { settingName: 'testToggle', newValue: true },
      });
    });

    it('passes newValue to properties function', () => {
      const configWithDynamicProps: ToggleItemConfig = {
        ...testConfig,
        dataTestId: 'test-toggle-dynamic',
        trackEvent: {
          event: MetaMetricsEventName.SettingsUpdated,
          properties: (newValue) => ({ isEnabled: newValue }),
        },
      };

      const TestToggleDynamic = createToggleItem(configWithDynamicProps);
      const mockStore = createMockStore({ testToggleValue: false });

      renderWithProvider(
        <MetaMetricsContext.Provider
          value={{ trackEvent: mockTrackEvent } as never}
        >
          <TestToggleDynamic />
        </MetaMetricsContext.Provider>,
        mockStore,
      );

      fireEvent.click(screen.getByTestId('test-toggle-dynamic'));

      expect(mockTrackEvent).toHaveBeenCalledWith({
        category: MetaMetricsEventCategory.Settings,
        event: MetaMetricsEventName.SettingsUpdated,
        properties: { isEnabled: true },
      });
    });
  });
});
