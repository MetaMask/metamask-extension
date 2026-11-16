import { fireEvent, screen } from '@testing-library/react';
import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import mockState from '../../../../test/data/mock-state.json';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { getIsSocialLoginFlow } from '../../../selectors/first-time-flow';
import { setBackgroundConnection } from '../../../store/background-connection';
import { MetaMetricsConsentContainer } from './metametrics-consent-container';

const mockSetDataCollectionForMarketing = jest.fn();
const mockSetMarketingConsent = jest.fn();

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
  optInToMarketing: () => {
    mockSetDataCollectionForMarketing(true);
    return { type: 'MOCK_ACTION' };
  },
  optOutOfMarketing: () => {
    mockSetDataCollectionForMarketing(false);
    return { type: 'MOCK_ACTION' };
  },
  setMarketingConsent: (hasEmailMarketingConsent: boolean) => () => {
    mockSetMarketingConsent(hasEmailMarketingConsent);
    return Promise.resolve(true);
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
    (getIsSocialLoginFlow as jest.Mock).mockReturnValue(false);
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

  it('renders when MetaMetrics is off and no marketing decision was made', () => {
    renderWithProvider(
      <MetaMetricsConsentContainer />,
      createMockStore({ optedIn: false }),
    );

    expect(
      screen.getByText(messages.onboardedMetametricsTitle.message),
    ).toBeInTheDocument();
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

  it('posts marketing consent to OAuth for social login users when accept is clicked', () => {
    (getIsSocialLoginFlow as jest.Mock).mockReturnValue(true);
    renderWithProvider(<MetaMetricsConsentContainer />, createMockStore());

    fireEvent.click(
      screen.getByRole('button', {
        name: messages.onboardedMetametricsAccept.message,
      }),
    );

    expect(mockSetMarketingConsent).toHaveBeenCalledWith(true);
  });

  it('posts marketing consent to OAuth for social login users when declined', () => {
    (getIsSocialLoginFlow as jest.Mock).mockReturnValue(true);
    renderWithProvider(<MetaMetricsConsentContainer />, createMockStore());

    fireEvent.click(
      screen.getByRole('button', {
        name: messages.onboardedMetametricsDisagree.message,
      }),
    );

    expect(mockSetMarketingConsent).toHaveBeenCalledWith(false);
  });

  it('does not post marketing consent to OAuth for non-social login users', () => {
    renderWithProvider(<MetaMetricsConsentContainer />, createMockStore());

    fireEvent.click(
      screen.getByRole('button', {
        name: messages.onboardedMetametricsAccept.message,
      }),
    );

    expect(mockSetMarketingConsent).not.toHaveBeenCalled();
  });
});
