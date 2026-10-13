import { fireEvent, screen } from '@testing-library/react';
import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import mockState from '../../../../test/data/mock-state.json';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { getIsSocialLoginFlow } from '../../../selectors/first-time-flow';
import { setBackgroundConnection } from '../../../store/background-connection';
import {
  MetaMetricsEventName,
  MetaMetricsUserTrait,
} from '../../../../shared/constants/metametrics';
import { DataCollectionToggleItem } from './data-collection-item';

const mockSetDataCollectionForMarketing = jest.fn();
const mockTrackAnalyticsEvent = jest.fn();

jest.mock('../../../hooks/useAnalytics', () => {
  const { createEventBuilder } = jest.requireActual(
    '../../../../shared/lib/analytics/create-event-builder',
  );

  return {
    useAnalytics: () => ({
      trackEvent: mockTrackAnalyticsEvent,
      createEventBuilder,
    }),
  };
});

jest.mock('../../../selectors/first-time-flow', () => {
  const actual = jest.requireActual<
    typeof import('../../../selectors/first-time-flow')
  >('../../../selectors/first-time-flow');
  return {
    ...actual,
    getIsSocialLoginFlow: jest.fn().mockReturnValue(false),
  };
});

jest.mock('../../../store/actions', () => ({
  ...jest.requireActual('../../../store/actions'),
  setDataCollectionForMarketing: (val: boolean) => {
    mockSetDataCollectionForMarketing(val);
    return { type: 'MOCK_ACTION' };
  },
}));

const backgroundConnectionMock = new Proxy(
  {},
  { get: () => jest.fn().mockResolvedValue(undefined) },
);

const createMockStore = (overrides = {}) =>
  configureMockStore([thunk])({
    ...mockState,
    metamask: {
      ...mockState.metamask,
      useExternalServices: true,
      consentDecisionMade: true,
      optedIn: true,
      marketingConsentDecisionMade: true,
      optedInToMarketing: false,
      ...overrides,
    },
  });

describe('DataCollectionToggleItem', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setBackgroundConnection(backgroundConnectionMock as never);
    (getIsSocialLoginFlow as jest.Mock).mockReturnValue(false);
  });

  it('renders title', () => {
    const mockStore = createMockStore();
    renderWithProvider(<DataCollectionToggleItem />, mockStore);

    expect(
      screen.getByText(messages.dataCollectionForMarketing.message),
    ).toBeInTheDocument();
  });

  it('renders description', () => {
    const mockStore = createMockStore();
    renderWithProvider(<DataCollectionToggleItem />, mockStore);

    expect(
      screen.getByText(messages.dataCollectionForMarketingDescription.message),
    ).toBeInTheDocument();
  });

  it('preserves the social-login marketing description', () => {
    (getIsSocialLoginFlow as jest.Mock).mockReturnValue(true);
    renderWithProvider(<DataCollectionToggleItem />, createMockStore());

    expect(
      screen.getByText(
        messages.dataCollectionForMarketingDescriptionSocialLogin.message,
      ),
    ).toBeInTheDocument();
  });

  it('renders toggle in enabled state', () => {
    const mockStore = createMockStore({ optedInToMarketing: true });
    renderWithProvider(<DataCollectionToggleItem />, mockStore);

    expect(
      screen.getByTestId('data-collection-for-marketing-input'),
    ).toHaveAttribute('value', 'true');
  });

  it('renders toggle in disabled state', () => {
    const mockStore = createMockStore({ optedInToMarketing: false });
    renderWithProvider(<DataCollectionToggleItem />, mockStore);

    expect(
      screen.getByTestId('data-collection-for-marketing-input'),
    ).toHaveAttribute('value', 'false');
  });

  it('calls setDataCollectionForMarketing with true when toggled on', () => {
    const mockStore = createMockStore({ optedInToMarketing: false });
    renderWithProvider(<DataCollectionToggleItem />, mockStore);

    fireEvent.click(screen.getByTestId('data-collection-for-marketing-input'));

    expect(mockSetDataCollectionForMarketing).toHaveBeenCalledWith(true);
  });

  it('calls setDataCollectionForMarketing with false when toggled off', () => {
    const mockStore = createMockStore({ optedInToMarketing: true });
    renderWithProvider(<DataCollectionToggleItem />, mockStore);

    fireEvent.click(screen.getByTestId('data-collection-for-marketing-input'));

    expect(mockSetDataCollectionForMarketing).toHaveBeenCalledWith(false);
  });

  it('is disabled when useExternalServices is false', () => {
    const mockStore = createMockStore({ useExternalServices: false });
    renderWithProvider(<DataCollectionToggleItem />, mockStore);

    const toggle = screen.getByRole('checkbox');
    expect(toggle.closest('.toggle-button--disabled')).toBeInTheDocument();
  });

  it('is enabled when metrics participation is off', () => {
    const mockStore = createMockStore({ optedIn: false });
    renderWithProvider(<DataCollectionToggleItem />, mockStore);

    const toggle = screen.getByRole('checkbox');
    expect(toggle.closest('.toggle-button--disabled')).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('data-collection-for-marketing-input'));

    expect(mockSetDataCollectionForMarketing).toHaveBeenCalledWith(true);
    expect(mockTrackAnalyticsEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        name: MetaMetricsEventName.AnalyticsPreferenceSelected,
        properties: expect.objectContaining({
          [MetaMetricsUserTrait.IsMetricsOptedIn]: false,
        }),
      }),
    );
  });
});
