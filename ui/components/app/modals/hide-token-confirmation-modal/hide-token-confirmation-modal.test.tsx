import React from 'react';
import configureMockStore from 'redux-mock-store';
import { fireEvent, waitFor } from '@testing-library/react';
import thunk from 'redux-thunk';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import mockState from '../../../../../test/data/mock-state.json';
import { DEFAULT_ROUTE } from '../../../../helpers/constants/routes';
import HideTokenConfirmationModal from '.';

type MockToken = {
  assetId?: string;
  symbol?: string;
  address: string;
  image?: string;
  chainId?: string;
};

const mockUseNavigate = jest.fn();
const mockOnClose = jest.fn();
const mockHideAsset = jest
  .fn()
  .mockReturnValue(jest.fn().mockResolvedValue(undefined));

jest.mock('../../../../store/actions.ts', () => ({
  ...jest.requireActual('../../../../store/actions.ts'),
  hideAsset: (...args: unknown[]) => mockHideAsset(...args),
}));

describe('Hide Token Confirmation Modal', () => {
  const tokenState: MockToken = {
    address: '0x617b3f8050a0BD94b6b1da02B4384eE5B4DF13F4',
    symbol: 'TKN',
    image: '',
    chainId: '0x5',
  };

  const createMockStore = () => configureMockStore([thunk])(mockState);

  const renderModal = (
    token: MockToken = tokenState,
    navigate = mockUseNavigate,
  ) =>
    renderWithProvider(
      <HideTokenConfirmationModal
        token={token}
        isOpen
        onClose={mockOnClose}
        navigate={navigate}
      />,
      createMockStore(),
    );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('matches snapshot', () => {
    const { baseElement } = renderModal();

    expect(baseElement).toMatchSnapshot();
  });

  it('hides the modal when cancel button is clicked', () => {
    const { getByTestId } = renderModal();

    const cancelButton = getByTestId('hide-token-confirmation__cancel');
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
    expect(mockHideAsset).not.toHaveBeenCalled();
    expect(mockUseNavigate).not.toHaveBeenCalled();
  });

  it('hides token with address and chainId and navigates to default route', async () => {
    const { getByTestId } = renderModal();

    const hideButton = getByTestId('hide-token-confirmation__hide');
    fireEvent.click(hideButton);

    await waitFor(() => {
      expect(mockHideAsset).toHaveBeenCalledWith(
        'eip155:5/erc20:0x617b3f8050a0BD94b6b1da02B4384eE5B4DF13F4',
      );
    });
    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
      expect(mockUseNavigate).toHaveBeenCalledWith(DEFAULT_ROUTE);
    });
  });

  it('hides token when assetId is provided', async () => {
    const nonEvmToken: MockToken = {
      assetId:
        'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      symbol: 'USDC',
      image: '',
    };

    const { getByTestId } = renderModal(nonEvmToken);

    const hideButton = getByTestId('hide-token-confirmation__hide');
    fireEvent.click(hideButton);

    await waitFor(() => {
      expect(mockHideAsset).toHaveBeenCalledWith(nonEvmToken.assetId);
    });
    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
      expect(mockUseNavigate).toHaveBeenCalledWith(DEFAULT_ROUTE);
    });
  });

  it('still hides modal and navigates when hiding asset fails', async () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    mockHideAsset.mockReturnValueOnce(
      jest.fn().mockRejectedValue(new Error('Failed to hide asset')),
    );

    const { getByTestId } = renderModal();

    const hideButton = getByTestId('hide-token-confirmation__hide');
    fireEvent.click(hideButton);

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
      expect(mockUseNavigate).toHaveBeenCalledWith(DEFAULT_ROUTE);
    });
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error hiding asset:',
      expect.any(Error),
    );
    consoleErrorSpy.mockRestore();
  });

  it('does not dispatch hideAsset if assetId cannot be computed', async () => {
    const invalidToken: MockToken = {
      address: 'invalid-address',
      symbol: 'INV',
    };

    const { getByTestId } = renderModal(invalidToken);

    const hideButton = getByTestId('hide-token-confirmation__hide');
    fireEvent.click(hideButton);

    expect(mockHideAsset).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
      expect(mockUseNavigate).toHaveBeenCalledWith(DEFAULT_ROUTE);
    });
  });
});
