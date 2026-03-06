import React from 'react';
import { fireEvent } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import { getMockPersonalSignConfirmState } from '../../../../../../test/data/confirmations/helper';
import { unapprovedPersonalSignMsg } from '../../../../../../test/data/confirmations/personal_sign';
import { renderWithConfirmContextProvider } from '../../../../../../test/lib/confirmations/render-helpers';
import { Severity } from '../../../../../helpers/constants/design-system';
import { AlertsName } from '../../../hooks/alerts/constants';
import {
  useIsTransactionPayLoading,
  useTransactionPayRequiredTokens,
} from '../../../hooks/pay/useTransactionPayData';
import MusdConversionFooter from './musd-conversion-footer';

jest.mock('../../../hooks/pay/useTransactionPayData');

const CONFIRMATION_ID = unapprovedPersonalSignMsg.id;

const mockStore = configureMockStore([]);

const MOCK_ON_SUBMIT = jest.fn();

function render({
  isGaslessLoading = false,
  alerts = [] as {
    key: string;
    severity: string;
    message: string;
    isBlocking?: boolean;
  }[],
}: {
  isGaslessLoading?: boolean;
  alerts?: {
    key: string;
    severity: string;
    message: string;
    isBlocking?: boolean;
  }[];
} = {}) {
  const baseState = getMockPersonalSignConfirmState();

  const state = {
    ...baseState,
    confirmAlerts: {
      alerts: { [CONFIRMATION_ID]: alerts },
      confirmed: {},
    },
  };

  return renderWithConfirmContextProvider(
    <MusdConversionFooter
      onSubmit={MOCK_ON_SUBMIT}
      isGaslessLoading={isGaslessLoading}
    />,
    mockStore(state),
  );
}

describe('MusdConversionFooter', () => {
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

  it('renders the convert button', () => {
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

  it('disables button and shows insufficient balance text for InsufficientPayTokenNative blocking alert', () => {
    const { getByTestId } = render({
      alerts: [
        {
          key: AlertsName.InsufficientPayTokenNative,
          severity: Severity.Danger,
          message: 'Insufficient native token',
          isBlocking: true,
        },
      ],
    });

    const button = getByTestId('confirm-footer-button');
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent('Insufficient funds');
  });

  it('shows insufficient balance text for InsufficientPayTokenBalance alert', () => {
    const { getByTestId } = render({
      alerts: [
        {
          key: AlertsName.InsufficientPayTokenBalance,
          severity: Severity.Danger,
          message: 'Insufficient token balance',
          isBlocking: true,
        },
      ],
    });

    const button = getByTestId('confirm-footer-button');
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent('Insufficient funds');
  });

  it('shows insufficient balance text for InsufficientPayTokenFees alert', () => {
    const { getByTestId } = render({
      alerts: [
        {
          key: AlertsName.InsufficientPayTokenFees,
          severity: Severity.Danger,
          message: 'Insufficient token for fees',
          isBlocking: true,
        },
      ],
    });

    const button = getByTestId('confirm-footer-button');
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent('Insufficient funds');
  });

  it('shows generic convert text for non-balance blocking alerts', () => {
    const { getByTestId } = render({
      alerts: [
        {
          key: AlertsName.Blockaid,
          severity: Severity.Danger,
          message: 'Security alert',
          isBlocking: true,
        },
      ],
    });

    const button = getByTestId('confirm-footer-button');
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent('Convert');
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
});
