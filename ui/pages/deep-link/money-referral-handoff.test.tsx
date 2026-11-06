import React from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { act, fireEvent, render, screen } from '@testing-library/react';
import type { MoneyReferralOffer } from '../../../shared/lib/deep-links/money-referral';
import { MoneyReferralHandoff } from './money-referral-handoff';

const mockNavigate = jest.fn();
const mockCall = jest.fn();
const mockParse = jest.fn();
let mockLocation = {
  pathname: '/referral-invite',
  search: '?context=one&u=https%3A%2F%2Flink.metamask.io%2Fswap%3Fref%3DABC',
  hash: '',
};

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: () => mockLocation,
  useNavigate: () => mockNavigate,
  Navigate: ({ to }: { to: string }) => <div data-testid="redirect">{to}</div>,
}));
jest.mock('../../../shared/lib/deep-links/parse', () => ({
  parse: (...args: unknown[]) => mockParse(...args),
}));
jest.mock('../../hooks/useMessenger', () => {
  const messenger = { call: (...args: unknown[]) => mockCall(...args) };
  return { useMessenger: () => messenger };
});
jest.mock('../../hooks/useAnalytics', () => ({
  useAnalytics: () => ({
    trackEvent: jest.fn().mockResolvedValue(undefined),
    createEventBuilder: jest.requireActual(
      '../../../shared/lib/analytics/create-event-builder',
    ).createEventBuilder,
  }),
}));
jest.mock('../../contexts/route-messenger', () => ({
  RouteMessengerProvider: ({ children }: { children: React.ReactNode }) =>
    children,
}));
jest.mock('../../selectors', () => ({
  getUseExternalServices: () => true,
  getShowTermsOfUse: (state: { metamask: { termsOwed: boolean } }) =>
    state.metamask.termsOwed,
}));
jest.mock('../../selectors/identity/authentication', () => ({
  selectSessionData: () => undefined,
}));
jest.mock('../../store/actions', () => ({
  setTermsOfUseLastAgreed: () => ({ type: 'agree' }),
}));
jest.mock('../../components/app/terms-of-use-popup/terms-of-use-popup', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Jest module interoperability
  __esModule: true,
  default: ({ onAccept }: { onAccept: () => void }) => (
    <button onClick={onAccept}>Agree to terms</button>
  ),
}));
jest.mock(
  '../../components/app/rewards/money-referral/AcceptInviteSheet',
  () => ({
    AcceptInviteSheet: ({
      initialCode,
      entryType,
      onClose,
    }: {
      initialCode: string;
      entryType: string;
      onClose: () => void;
    }) => (
      <button
        data-testid="invite"
        data-entry-type={entryType}
        onClick={() => {
          onClose();
          onClose();
        }}
      >
        {initialCode}
      </button>
    ),
  }),
);

const offer: MoneyReferralOffer = {
  id: 'one',
  url: 'https://link.metamask.io/swap?ref=ABC&amount=123',
  code: 'ABC',
  entryType: 'deeplink',
  status: 'authorized',
  canOffer: true,
};

function renderHandoff({
  completed = true,
  unlocked = true,
  termsOwed = false,
  strict = false,
} = {}) {
  const initialState = {
    metamask: {
      completedOnboarding: completed,
      isUnlocked: unlocked,
      termsOwed,
    },
  };
  const store = configureStore({
    reducer: (state: typeof initialState | undefined, action) => {
      const current = state ?? initialState;
      return action.type === 'agree'
        ? { metamask: { ...current.metamask, termsOwed: false } }
        : current;
    },
  });
  const element = (
    <Provider store={store}>
      <MoneyReferralHandoff />
    </Provider>
  );
  return render(
    strict ? <React.StrictMode>{element}</React.StrictMode> : element,
  );
}

describe('MoneyReferralHandoff', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCall.mockImplementation(async (action: string) =>
      action.endsWith(':takeReferralContext') ? offer : undefined,
    );
    mockParse.mockResolvedValue({
      signature: 'missing',
      destination: {
        path: '/bridge/prepare',
        query: new URLSearchParams({ amount: '123' }),
      },
    });
  });

  it('waits for onboarding without taking the code', () => {
    renderHandoff({ completed: false });
    expect(screen.getByTestId('redirect')).toHaveTextContent('/onboarding');
    expect(mockCall).not.toHaveBeenCalled();
  });

  it('waits for unlock without taking the code', () => {
    renderHandoff({ unlocked: false });
    expect(screen.getByTestId('redirect')).toHaveTextContent('/unlock');
    expect(mockCall).not.toHaveBeenCalled();
  });

  it('shows Terms before the invite for a new user', async () => {
    renderHandoff({ termsOwed: true });
    await act(async () => undefined);
    expect(screen.queryByTestId('invite')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Agree to terms' }));
    expect(screen.getByTestId('invite')).toHaveTextContent('ABC');
    expect(screen.getByTestId('invite')).toHaveAttribute(
      'data-entry-type',
      'deeplink',
    );
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('navigates once with original product parameters', async () => {
    renderHandoff();
    await act(async () => undefined);
    await act(async () => {
      fireEvent.click(screen.getByTestId('invite'));
    });
    expect(mockParse).toHaveBeenCalledWith(new URL(offer.url));
    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('/bridge/prepare?amount=123', {
      replace: true,
    });
  });

  it('does not repeat the atomic take during StrictMode effect replay', async () => {
    renderHandoff({ strict: true });
    await act(async () => undefined);
    expect(screen.getByTestId('invite')).toBeInTheDocument();
    expect(mockCall).toHaveBeenCalledTimes(1);
  });

  it('returns missing context to the security interstitial instead of trusting the URL', async () => {
    mockCall.mockResolvedValue(null);
    renderHandoff();
    await act(async () => undefined);
    expect(screen.queryByTestId('invite')).not.toBeInTheDocument();
    expect(mockNavigate).toHaveBeenCalledWith('/link?u=%2Fswap%3Fref%3DABC', {
      replace: true,
    });
  });

  it('skips an offer disabled by Basic Functionality without repeating the warning', async () => {
    mockCall.mockResolvedValue({ ...offer, canOffer: false });
    renderHandoff();
    await act(async () => undefined);
    expect(screen.queryByTestId('invite')).not.toBeInTheDocument();
    expect(mockNavigate).toHaveBeenCalledWith('/bridge/prepare?amount=123', {
      replace: true,
    });
  });

  it('rejects an arbitrary fallback URL', async () => {
    mockCall.mockResolvedValue(null);
    const previous = mockLocation;
    mockLocation = { ...mockLocation, search: '?u=https%3A%2F%2Fevil.test%2F' };
    try {
      renderHandoff();
      await act(async () => undefined);
      expect(mockParse).not.toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
    } finally {
      mockLocation = previous;
    }
  });
});
