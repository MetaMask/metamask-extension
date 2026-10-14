import { fireEvent, screen } from '@testing-library/react';
import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import mockState from '../../../../test/data/mock-state.json';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { setBackgroundConnection } from '../../../store/background-connection';
import { MetaMetricsConsentContainer } from './metametrics-consent-container';

const mockSetDataCollectionForMarketing = jest.fn();

jest.mock('../../../store/actions', () => ({
  ...jest.requireActual('../../../store/actions'),
  setDataCollectionForMarketing: (value: boolean) => {
    mockSetDataCollectionForMarketing(value);
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
      consentDecisionMade: true,
      optedIn: true,
      marketingConsentDecisionMade: false,
      ...overrides,
    },
  });

describe('MetaMetricsConsentContainer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setBackgroundConnection(backgroundConnectionMock as never);
  });

  it('renders the modal with title and actions', () => {
    renderWithProvider(<MetaMetricsConsentContainer />, createMockStore());

    expect(
      screen.getByText(messages.onboardedMetametricsTitle.message),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: messages.onboardedMetametricsDisagree.message,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: messages.onboardedMetametricsAccept.message,
      }),
    ).toBeInTheDocument();
  });

  it('renders nothing when a marketing decision has already been made', () => {
    renderWithProvider(
      <MetaMetricsConsentContainer />,
      createMockStore({ marketingConsentDecisionMade: true }),
    );

    expect(
      screen.queryByText(messages.onboardedMetametricsTitle.message),
    ).not.toBeInTheDocument();
  });

  it('renders nothing when MetaMetrics is not enabled', () => {
    renderWithProvider(
      <MetaMetricsConsentContainer />,
      createMockStore({ optedIn: false }),
    );

    expect(
      screen.queryByText(messages.onboardedMetametricsTitle.message),
    ).not.toBeInTheDocument();
  });

  it('opts in when the accept button is clicked', () => {
    renderWithProvider(<MetaMetricsConsentContainer />, createMockStore());

    fireEvent.click(
      screen.getByRole('button', {
        name: messages.onboardedMetametricsAccept.message,
      }),
    );

    expect(mockSetDataCollectionForMarketing).toHaveBeenCalledWith(true);
  });

  it('opts out when the decline button is clicked', () => {
    renderWithProvider(<MetaMetricsConsentContainer />, createMockStore());

    fireEvent.click(
      screen.getByRole('button', {
        name: messages.onboardedMetametricsDisagree.message,
      }),
    );

    expect(mockSetDataCollectionForMarketing).toHaveBeenCalledWith(false);
  });

  it('opts out when the modal is closed', () => {
    renderWithProvider(<MetaMetricsConsentContainer />, createMockStore());

    fireEvent.click(
      screen.getByRole('button', { name: messages.close.message }),
    );

    expect(mockSetDataCollectionForMarketing).toHaveBeenCalledWith(false);
  });
});
