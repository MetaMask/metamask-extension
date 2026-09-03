import React from 'react';
import { act, fireEvent, screen } from '@testing-library/react';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
// eslint-disable-next-line import-x/no-restricted-paths
import messages from '../../../../app/_locales/en/messages.json';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { UPDATE_METAMASK_STATE } from '../../../store/actionConstants';
import { submitRequestToBackground } from '../../../store/background-connection';
import { ArcUsageNoticeToast } from './arc-usage-notice-toast';

jest.mock('../../../store/background-connection', () => ({
  submitRequestToBackground: jest.fn().mockResolvedValue(undefined),
}));

const mockSubmit = submitRequestToBackground as jest.MockedFunction<
  typeof submitRequestToBackground
>;

const mockTrackEvent = jest.fn();

jest.mock('../../../hooks/useAnalytics', () => {
  const { createEventBuilder } = jest.requireActual(
    '../../../../shared/lib/analytics/create-event-builder',
  );
  return {
    useAnalytics: () => ({
      trackEvent: mockTrackEvent,
      createEventBuilder,
    }),
  };
});

const ARC_ACCOUNT = '0x0DCD5D886577d5081B0c52e242Ef29E70Be3E7bc';
const NATIVE_ASSET = '0x0000000000000000000000000000000000000000';

function createArcStore(overrides: {
  balance: string;
  arcUsageNoticeShown?: boolean;
}) {
  return configureStore({
    metamask: {
      ...mockState.metamask,
      isUnlocked: true,
      arcUsageNoticeShown: overrides.arcUsageNoticeShown ?? false,
      tokenBalances: {
        [ARC_ACCOUNT]: {
          [CHAIN_IDS.ARC]: { [NATIVE_ASSET]: overrides.balance },
        },
      },
    },
    appState: { ...mockState.appState },
  });
}

describe('ArcUsageNoticeToast', () => {
  beforeEach(() => {
    mockSubmit.mockClear();
    mockTrackEvent.mockClear();
  });

  it('renders when an account holds a non-zero Arc balance and the notice was never shown', () => {
    renderWithProvider(
      <ArcUsageNoticeToast />,
      createArcStore({ balance: '0xde0b6b3a7640000' }),
    );

    expect(screen.getByTestId('arc-usage-notice-toast')).toBeInTheDocument();
    expect(
      screen.getByText(messages.arcUsageNoticeTitle.message),
    ).toBeInTheDocument();
    expect(
      screen.getByText(messages.arcUsageNoticeDescription.message),
    ).toBeInTheDocument();
  });

  it('marks the notice as shown once it renders', () => {
    renderWithProvider(
      <ArcUsageNoticeToast />,
      createArcStore({ balance: '0xde0b6b3a7640000' }),
    );

    expect(mockSubmit).toHaveBeenCalledWith('setArcUsageNoticeShown');
    expect(mockSubmit).toHaveBeenCalledTimes(1);
  });

  it('stays visible after the background sync flips the flag', () => {
    const store = createArcStore({ balance: '0xde0b6b3a7640000' });
    renderWithProvider(<ArcUsageNoticeToast />, store);

    act(() => {
      store.dispatch({
        type: UPDATE_METAMASK_STATE,
        value: { arcUsageNoticeShown: true },
      });
    });

    expect(screen.getByTestId('arc-usage-notice-toast')).toBeInTheDocument();
    expect(mockSubmit).toHaveBeenCalledTimes(1);
  });

  it('stays hidden after being closed while the flag has not synced yet', () => {
    const store = createArcStore({ balance: '0xde0b6b3a7640000' });
    renderWithProvider(<ArcUsageNoticeToast />, store);

    fireEvent.click(
      screen.getByRole('button', { name: messages.close.message }),
    );

    act(() => {
      store.dispatch({
        type: UPDATE_METAMASK_STATE,
        value: { ...store.getState().metamask },
      });
    });

    expect(
      screen.queryByTestId('arc-usage-notice-toast'),
    ).not.toBeInTheDocument();
  });

  it('hides the toast when closed', () => {
    renderWithProvider(
      <ArcUsageNoticeToast />,
      createArcStore({ balance: '0xde0b6b3a7640000' }),
    );

    fireEvent.click(
      screen.getByRole('button', { name: messages.close.message }),
    );

    expect(
      screen.queryByTestId('arc-usage-notice-toast'),
    ).not.toBeInTheDocument();
  });

  it('tracks a dismissed event when closed', () => {
    renderWithProvider(
      <ArcUsageNoticeToast />,
      createArcStore({ balance: '0xde0b6b3a7640000' }),
    );

    fireEvent.click(
      screen.getByRole('button', { name: messages.close.message }),
    );

    expect(mockTrackEvent).toHaveBeenCalledTimes(1);
    expect(mockTrackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        name: MetaMetricsEventName.ArcUsageNoticeToastDismissed,
        properties: expect.objectContaining({
          category: MetaMetricsEventCategory.Home,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          chain_id_caip: 'eip155:5042',
        }),
      }),
    );
  });

  it('does not track a viewed event on render', () => {
    renderWithProvider(
      <ArcUsageNoticeToast />,
      createArcStore({ balance: '0xde0b6b3a7640000' }),
    );

    expect(screen.getByTestId('arc-usage-notice-toast')).toBeInTheDocument();
    expect(mockTrackEvent).not.toHaveBeenCalled();
  });

  it('does not render when the Arc balance is zero', () => {
    renderWithProvider(
      <ArcUsageNoticeToast />,
      createArcStore({ balance: '0x0' }),
    );

    expect(
      screen.queryByTestId('arc-usage-notice-toast'),
    ).not.toBeInTheDocument();
    expect(mockSubmit).not.toHaveBeenCalled();
  });

  it('does not render once the notice was shown', () => {
    renderWithProvider(
      <ArcUsageNoticeToast />,
      createArcStore({
        balance: '0xde0b6b3a7640000',
        arcUsageNoticeShown: true,
      }),
    );

    expect(
      screen.queryByTestId('arc-usage-notice-toast'),
    ).not.toBeInTheDocument();
    expect(mockSubmit).not.toHaveBeenCalled();
  });
});
