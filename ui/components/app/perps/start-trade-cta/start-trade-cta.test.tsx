import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../../store/store';
import mockState from '../../../../../test/data/mock-state.json';
import { AccessRestrictedProvider } from '../../compliance';
import { StartTradeCta } from './start-trade-cta';

const mockUsePerpsEligibility = jest.fn(() => ({ isEligible: true }));
const mockTrack = jest.fn();
const mockSubmitRequestToBackground = jest.fn();

jest.mock('../../../../hooks/perps', () => ({
  usePerpsEligibility: () => mockUsePerpsEligibility(),
  usePerpsEventTracking: () => ({ track: mockTrack }),
}));

jest.mock('../../../../store/background-connection', () => ({
  submitRequestToBackground: (...args: unknown[]) =>
    mockSubmitRequestToBackground(...args),
}));

const mockStore = configureStore({
  metamask: {
    ...mockState.metamask,
  },
});
const selectedAccountId = mockState.metamask.internalAccounts
  .selectedAccount as keyof typeof mockState.metamask.internalAccounts.accounts;
const selectedAccountAddress =
  mockState.metamask.internalAccounts.accounts[selectedAccountId].address;

function renderStartTradeCta(
  component: React.ReactElement,
  store = mockStore,
) {
  return renderWithProvider(
    <AccessRestrictedProvider>{component}</AccessRestrictedProvider>,
    store,
  );
}

describe('StartTradeCta', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePerpsEligibility.mockReturnValue({ isEligible: true });
    mockSubmitRequestToBackground.mockResolvedValue([
      {
        address: selectedAccountAddress,
        blocked: false,
        checkedAt: '2026-05-05T00:00:00.000Z',
      },
    ]);
  });

  it('renders the CTA button', () => {
    renderStartTradeCta(<StartTradeCta />);

    expect(screen.getByTestId('start-new-trade-cta')).toBeInTheDocument();
  });

  it('displays the start new trade text', () => {
    renderStartTradeCta(<StartTradeCta />);

    expect(screen.getByText(/start a new trade/iu)).toBeInTheDocument();
  });

  it('calls onPress when clicked', () => {
    const onPress = jest.fn();
    renderStartTradeCta(<StartTradeCta onPress={onPress} />);

    const button = screen.getByTestId('start-new-trade-cta');
    fireEvent.click(button);

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('renders without onPress callback', () => {
    renderStartTradeCta(<StartTradeCta />);

    const button = screen.getByTestId('start-new-trade-cta');
    expect(() => fireEvent.click(button)).not.toThrow();
  });

  it('is clickable as a button', () => {
    const onPress = jest.fn();
    renderStartTradeCta(<StartTradeCta onPress={onPress} />);

    const button = screen.getByTestId('start-new-trade-cta');
    expect(button).not.toBeDisabled();
  });

  it('renders the plus icon', () => {
    renderStartTradeCta(<StartTradeCta />);

    const cta = screen.getByTestId('start-new-trade-cta');
    expect(cta).toBeInTheDocument();
  });

  it('handles multiple clicks', () => {
    const onPress = jest.fn();
    renderStartTradeCta(<StartTradeCta onPress={onPress} />);

    const button = screen.getByTestId('start-new-trade-cta');
    fireEvent.click(button);
    fireEvent.click(button);
    fireEvent.click(button);

    expect(onPress).toHaveBeenCalledTimes(3);
  });

  it('shows geo-block modal and does not call onPress when geo-blocked', () => {
    mockUsePerpsEligibility.mockReturnValue({ isEligible: false });
    const onPress = jest.fn();
    renderStartTradeCta(<StartTradeCta onPress={onPress} />);

    fireEvent.click(screen.getByTestId('start-new-trade-cta'));
    expect(onPress).not.toHaveBeenCalled();
    expect(screen.getByTestId('perps-geo-block-modal')).toBeInTheDocument();
  });

  it('does not call onPress when the selected wallet is compliance blocked', async () => {
    mockSubmitRequestToBackground.mockResolvedValue([
      {
        address: selectedAccountAddress,
        blocked: true,
        checkedAt: '2026-05-05T00:00:00.000Z',
      },
    ]);
    const blockedStore = configureStore({
      metamask: {
        ...mockState.metamask,
        remoteFeatureFlags: {
          ...mockState.metamask.remoteFeatureFlags,
          complianceEnabled: true,
        },
      },
    });
    const onPress = jest.fn();

    renderStartTradeCta(<StartTradeCta onPress={onPress} />, blockedStore);

    fireEvent.click(screen.getByTestId('start-new-trade-cta'));

    await waitFor(() => {
      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'complianceCheckWalletsCompliance',
        [[selectedAccountAddress]],
      );
    });
    expect(onPress).not.toHaveBeenCalled();
  });
});
