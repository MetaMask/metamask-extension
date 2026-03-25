import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProvider } from '../../../test/lib/render-helpers-navigate';
import configureStore from '../../store/store';
import mockState from '../../../test/data/mock-state.json';
import { getIsPerpsExperienceAvailable } from '../../selectors/perps/feature-flags';
import PerpsWithdrawPage from './perps-withdraw-page';
import { submitRequestToBackground } from '../../store/background-connection';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  Navigate: ({ to }: { to: string }) => (
    <div data-testid="navigate-to">{to}</div>
  ),
}));

jest.mock('../../selectors/perps/feature-flags', () => ({
  getIsPerpsExperienceAvailable: jest.fn(),
}));

jest.mock('../../hooks/perps', () => ({
  usePerpsEligibility: () => ({ isEligible: true }),
}));

jest.mock('../../hooks/perps/stream', () => ({
  usePerpsLiveAccount: () => ({
    account: { availableBalance: '100' },
  }),
}));

jest.mock('../../store/background-connection', () => ({
  submitRequestToBackground: jest.fn(),
}));

const mockGetIsPerpsExperienceAvailable =
  getIsPerpsExperienceAvailable as jest.MockedFunction<
    typeof getIsPerpsExperienceAvailable
  >;

const mockSubmit = submitRequestToBackground as jest.MockedFunction<
  typeof submitRequestToBackground
>;

describe('PerpsWithdrawPage', () => {
  const createMockStore = () =>
    configureStore({
      metamask: {
        ...mockState.metamask,
        isTestnet: false,
      },
    });

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetIsPerpsExperienceAvailable.mockReturnValue(true);
    mockSubmit.mockImplementation((method: string) => {
      if (method === 'perpsGetWithdrawalRoutes') {
        return Promise.resolve([
          {
            assetId:
              'eip155:42161/erc20:0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
            chainId: 'eip155:42161',
            contractAddress:
              '0xaf88d065e77c8cC2239327C5EDb3A432268e5831' as `0x${string}`,
            constraints: { minAmount: '1.01' },
          },
        ]);
      }
      if (method === 'perpsValidateWithdrawal') {
        return Promise.resolve({ isValid: true });
      }
      if (method === 'perpsWithdraw') {
        return Promise.resolve({ success: true, withdrawalId: 'hl_test' });
      }
      return Promise.resolve(undefined);
    });
  });

  it('renders when perps experience is available', () => {
    renderWithProvider(<PerpsWithdrawPage />, createMockStore());

    expect(screen.getByTestId('perps-withdraw-page')).toBeInTheDocument();
    expect(screen.getByText('Withdraw funds')).toBeInTheDocument();
  });

  it('redirects when perps experience is disabled', () => {
    mockGetIsPerpsExperienceAvailable.mockReturnValue(false);

    renderWithProvider(<PerpsWithdrawPage />, createMockStore());

    expect(screen.getByTestId('navigate-to')).toHaveTextContent('/');
  });

  it('submits withdrawal when amount is valid', async () => {
    const user = userEvent.setup();
    renderWithProvider(<PerpsWithdrawPage />, createMockStore());

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith('perpsGetWithdrawalRoutes', []);
    });

    await user.type(screen.getByTestId('perps-withdraw-amount-input'), '50');
    await user.click(screen.getByTestId('perps-withdraw-continue'));

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith(
        'perpsValidateWithdrawal',
        expect.any(Array),
      );
      expect(mockSubmit).toHaveBeenCalledWith(
        'perpsWithdraw',
        expect.any(Array),
      );
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('navigates home when back is pressed', () => {
    renderWithProvider(<PerpsWithdrawPage />, createMockStore());

    fireEvent.click(screen.getByTestId('perps-withdraw-back-button'));

    expect(mockNavigate).toHaveBeenCalledWith('/');
  });
});
