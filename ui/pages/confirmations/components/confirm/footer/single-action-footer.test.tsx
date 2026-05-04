import React from 'react';
import { fireEvent } from '@testing-library/react';
import { TransactionType } from '@metamask/transaction-controller';
import { DefaultRootState } from 'react-redux';
import { getMockConfirmStateForTransaction } from '../../../../../../test/data/confirmations/helper';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../../test/data/confirmations/contract-interaction';
import { renderWithConfirmContextProvider } from '../../../../../../test/lib/confirmations/render-helpers';
import { enLocale as messages } from '../../../../../../test/lib/i18n-helpers';
import configureStore from '../../../../../store/store';
import { Severity } from '../../../../../helpers/constants/design-system';
import {
  useIsTransactionPayLoading,
  useTransactionPayRequiredTokens,
} from '../../../hooks/pay/useTransactionPayData';
import { SingleActionFooter } from './single-action-footer';

jest.mock('../../../hooks/pay/useTransactionPayData');

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

const MOCK_ON_SUBMIT = jest.fn();

function genMusdConversion() {
  const base = genUnapprovedContractInteractionConfirmation({ chainId: '0x1' });
  return { ...base, type: TransactionType.musdConversion, origin: 'metamask' };
}

function genPerpsDeposit() {
  const base = genUnapprovedContractInteractionConfirmation({ chainId: '0x1' });
  return { ...base, type: TransactionType.perpsDeposit, origin: 'metamask' };
}

function render({
  isGaslessLoading = false,
  confirmation = genMusdConversion(),
  alerts = [] as {
    key: string;
    severity: string;
    message: string;
    isBlocking?: boolean;
  }[],
}: {
  isGaslessLoading?: boolean;
  confirmation?:
    | ReturnType<typeof genMusdConversion>
    | ReturnType<typeof genPerpsDeposit>;
  alerts?: {
    key: string;
    severity: string;
    message: string;
    isBlocking?: boolean;
  }[];
} = {}) {
  const baseState = getMockConfirmStateForTransaction(
    confirmation,
  ) as DefaultRootState;

  const state = {
    ...baseState,
    confirmAlerts: {
      alerts: { [confirmation.id]: alerts },
      confirmed: {},
    },
  };

  return renderWithConfirmContextProvider(
    <SingleActionFooter
      onSubmit={MOCK_ON_SUBMIT}
      isGaslessLoading={isGaslessLoading}
    />,
    configureStore(state),
  );
}

describe('<SingleActionFooter />', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.mocked(useIsTransactionPayLoading).mockReturnValue(false);
    jest
      .mocked(useTransactionPayRequiredTokens)
      .mockReturnValue([
        { amountUsd: '10.00', skipIfBalance: false } as ReturnType<
          typeof useTransactionPayRequiredTokens
        >[number],
      ]);
  });

  it('renders the button', () => {
    const { getByTestId } = render();

    expect(getByTestId('confirm-footer-button')).toBeInTheDocument();
  });

  it('calls onSubmit when button is clicked', () => {
    const { getByTestId } = render();

    fireEvent.click(getByTestId('confirm-footer-button'));

    expect(MOCK_ON_SUBMIT).toHaveBeenCalledTimes(1);
  });

  it('shows loading state when gasless is loading', () => {
    const { getByTestId } = render({ isGaslessLoading: true });

    expect(getByTestId('confirm-footer-button')).not.toBeDisabled();
  });

  it('shows loading state when pay token data is loading', () => {
    jest.mocked(useIsTransactionPayLoading).mockReturnValue(true);

    const { getByTestId } = render();

    expect(getByTestId('confirm-footer-button')).not.toBeDisabled();
  });

  it('disables button when there is a blocking alert', () => {
    const { getByTestId } = render({
      alerts: [
        {
          key: 'some-blocking-alert',
          severity: Severity.Danger,
          message: 'Something is wrong',
          isBlocking: true,
        },
      ],
    });

    const button = getByTestId('confirm-footer-button');
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent(messages.musdConvert.message);
  });

  it('disables button when amount is zero', () => {
    jest
      .mocked(useTransactionPayRequiredTokens)
      .mockReturnValue([
        { amountUsd: '0', skipIfBalance: false } as ReturnType<
          typeof useTransactionPayRequiredTokens
        >[number],
      ]);

    const { getByTestId } = render();

    expect(getByTestId('confirm-footer-button')).toBeDisabled();
  });

  it('disables button when no required tokens exist', () => {
    jest.mocked(useTransactionPayRequiredTokens).mockReturnValue([]);

    const { getByTestId } = render();

    expect(getByTestId('confirm-footer-button')).toBeDisabled();
  });

  it('shows Add funds label for perpsDeposit transaction type', () => {
    const { getByTestId } = render({ confirmation: genPerpsDeposit() });

    expect(getByTestId('confirm-footer-button')).toHaveTextContent(
      messages.addFunds.message,
    );
  });
});
