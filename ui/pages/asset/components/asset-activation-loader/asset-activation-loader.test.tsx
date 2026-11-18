import React from 'react';
import { render } from '@testing-library/react';
import { useSelector } from 'react-redux';

import { STELLAR_WALLET_SNAP_ID } from '../../../../../shared/lib/accounts';
import { CONFIRMATION_V_NEXT_ROUTE } from '../../../../helpers/constants/routes';
import { AssetActivationLoader } from './asset-activation-loader';

const mockUseNavigate = jest.fn();
jest.mock('react-router-dom', () => {
  return {
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockUseNavigate,
  };
});

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

jest.mock('../../../../components/ui/loading-screen', () => ({
  // This is the name of the property that turns this into an ES module.
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __esModule: true,
  default: () => <div data-testid="loading-screen">Loading...</div>,
}));

describe('AssetActivationLoader', () => {
  const mockUseSelector = jest.mocked(useSelector);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading screen', () => {
    mockUseSelector.mockReturnValue([]);

    const { getByTestId } = render(<AssetActivationLoader />);

    expect(getByTestId('loading-screen')).toBeInTheDocument();
  });

  it('navigates to confirmation when a Stellar snap dialog is pending', () => {
    mockUseSelector.mockReturnValue([
      {
        id: 'trustline-approval-id',
        origin: STELLAR_WALLET_SNAP_ID,
      },
    ]);

    render(<AssetActivationLoader />);

    expect(mockUseNavigate).toHaveBeenCalledWith(
      `${CONFIRMATION_V_NEXT_ROUTE}/trustline-approval-id`,
      { replace: true },
    );
  });

  it('does not navigate when no pending confirmation exists', () => {
    mockUseSelector.mockReturnValue([]);

    render(<AssetActivationLoader />);

    expect(mockUseNavigate).not.toHaveBeenCalled();
  });

  it('does not navigate when pending confirmation is from another origin', () => {
    mockUseSelector.mockReturnValue([
      {
        id: 'other-id',
        origin: 'npm:@metamask/solana-wallet-snap',
      },
    ]);

    render(<AssetActivationLoader />);

    expect(mockUseNavigate).not.toHaveBeenCalled();
  });
});
