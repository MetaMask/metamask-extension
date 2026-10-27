import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react';
import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import {
  getMockConfirmStateForTransaction,
  getMockTokenTransferConfirmState,
} from '../../../../../../test/data/confirmations/helper';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../../test/data/confirmations/contract-interaction';
import { renderWithConfirmContextProvider } from '../../../../../../test/lib/confirmations/render-helpers';
import { tEn } from '../../../../../../test/lib/i18n-helpers';
import configureStore from '../../../../../store/store';
import * as ConfirmActions from '../../../hooks/useConfirmActions';
import * as ConfirmationNavigation from '../../../hooks/useConfirmationNavigation';
import { DAppInitiatedHeader } from './dapp-initiated-header';

const DAPP_ORIGIN_MOCK = 'https://example.test';

const getDappStateForType = (type: TransactionType) => {
  const base = genUnapprovedContractInteractionConfirmation({ chainId: '0x1' });
  return getMockConfirmStateForTransaction({
    ...base,
    type,
    origin: DAPP_ORIGIN_MOCK,
  } as TransactionMeta);
};

const render = (state = getMockTokenTransferConfirmState({})) => {
  const store = configureStore(state);
  return renderWithConfirmContextProvider(<DAppInitiatedHeader />, store);
};

describe('<DAppInitiatedHeader />', () => {
  const mockOnCancel = jest.fn();
  const mockNavigateNext = jest.fn();

  beforeEach(() => {
    jest.restoreAllMocks();
    mockOnCancel.mockReset().mockResolvedValue(undefined);
    mockNavigateNext.mockReset();

    jest.spyOn(ConfirmActions, 'useConfirmActions').mockReturnValue({
      onCancel: mockOnCancel,
      resetTransactionState: jest.fn(),
    });
    jest
      .spyOn(ConfirmationNavigation, 'useConfirmationNavigation')
      .mockReturnValue({
        navigateNext: mockNavigateNext,
      } as unknown as ReturnType<
        typeof ConfirmationNavigation.useConfirmationNavigation
      >);
  });

  it('should match snapshot', () => {
    const { container } = render();

    expect(container).toMatchSnapshot();
  });

  it('shows the transfer request title without a close button for other confirmations', () => {
    const { getByText, queryByTestId } = render(
      getDappStateForType(TransactionType.contractInteraction),
    );

    expect(getByText(tEn('transferRequest') as string)).toBeInTheDocument();
    expect(
      queryByTestId('dapp-initiated-header-close-button'),
    ).not.toBeInTheDocument();
  });

  it.each([
    [TransactionType.perpsDeposit, 'perpsDepositFundsTitle'],
    [TransactionType.perpsWithdraw, 'perpsWithdrawFundsTitle'],
  ])('shows the %s title and a close button', (type, titleKey) => {
    const { getByTestId, queryByText } = render(getDappStateForType(type));

    expect(getByTestId('dapp-initiated-header-title')).toHaveTextContent(
      tEn(titleKey) as string,
    );
    expect(queryByText(tEn('transferRequest') as string)).toBeNull();
    expect(
      getByTestId('dapp-initiated-header-close-button'),
    ).toBeInTheDocument();
  });

  it('rejects the request and moves to the next confirmation when close is clicked', async () => {
    const state = getDappStateForType(TransactionType.perpsDeposit);
    const transactionId = state.metamask.transactions[0].id;

    const { getByTestId } = render(state);
    fireEvent.click(getByTestId('dapp-initiated-header-close-button'));

    await waitFor(() => {
      expect(mockNavigateNext).toHaveBeenCalledWith(transactionId);
    });
    expect(mockOnCancel).toHaveBeenCalledWith({ location: 'confirmation' });
  });
});
