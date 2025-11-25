import React from 'react';
import { render } from '@testing-library/react';
import { useSelector } from 'react-redux';

import {
  BITCOIN_WALLET_SNAP_ID,
  SOLANA_WALLET_SNAP_ID,
} from '../../../../../../shared/lib/accounts';
import { CONFIRMATION_V_NEXT_ROUTE } from '../../../../../helpers/constants/routes';
import { Loader } from './loader';

const mockUseNavigate = jest.fn();
jest.mock('react-router-dom-v5-compat', () => {
  return {
    ...jest.requireActual('react-router-dom-v5-compat'),
    useNavigate: () => mockUseNavigate,
  };
});

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

jest.mock('../../../../../components/ui/loading-screen', () => ({
  // This is the name of the property that turns this into an ES module.
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __esModule: true,
  default: () => <div data-testid="loading-screen">Loading...</div>,
}));

describe('Loader', () => {
  const mockUseSelector = jest.mocked(useSelector);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading screen', () => {
    mockUseSelector.mockReturnValue([]);

    const { getByTestId } = render(<Loader />);

    expect(getByTestId('loading-screen')).toBeInTheDocument();
  });

  it('navigates to confirmation route when bitcoin pending send exists', () => {
    const pendingSend = {
      id: 'test-id',
      origin: BITCOIN_WALLET_SNAP_ID,
    };
    mockUseSelector.mockReturnValue([pendingSend]);

    render(<Loader />);

    expect(mockUseNavigate).toHaveBeenCalledWith(
      `${CONFIRMATION_V_NEXT_ROUTE}/test-id`,
    );
  });

  it('navigates to confirmation route when solana pending send exists', () => {
    const pendingSend = {
      id: 'test-id-2',
      origin: SOLANA_WALLET_SNAP_ID,
    };
    mockUseSelector.mockReturnValue([pendingSend]);

    render(<Loader />);

    expect(mockUseNavigate).toHaveBeenCalledWith(
      `${CONFIRMATION_V_NEXT_ROUTE}/test-id-2`,
    );
  });

  it('does not navigate when no pending send exists', () => {
    mockUseSelector.mockReturnValue([]);

    render(<Loader />);

    expect(mockUseNavigate).not.toHaveBeenCalled();
  });

  it('does not navigate when pending send has different origin', () => {
    const pendingSend = {
      id: 'test-id',
      origin: 'different-origin',
    };
    mockUseSelector.mockReturnValue([pendingSend]);

    render(<Loader />);

    expect(mockUseNavigate).not.toHaveBeenCalled();
  });
});
