import React from 'react';
import { userEvent } from '@testing-library/user-event';
import configureMockStore from 'redux-mock-store';
import { TransactionType } from '@metamask/transaction-controller';
import type {
  TransactionPayQuote,
  TransactionPayTotals,
} from '@metamask/transaction-pay-controller';
import type { Json } from '@metamask/utils';
import {
  getMockConfirmStateForTransaction,
  getMockPersonalSignConfirmState,
} from '../../../../../../test/data/confirmations/helper';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../../test/data/confirmations/contract-interaction';
import { renderWithConfirmContextProvider } from '../../../../../../test/lib/confirmations/render-helpers';
import {
  useIsTransactionPayLoading,
  useTransactionPayQuotes,
  useTransactionPayTotals,
} from '../../../hooks/pay/useTransactionPayData';
import { enLocale as messages } from '../../../../../../test/lib/i18n-helpers';
import { ConfirmInfoRowSize } from '../../../../../components/app/confirm/info/row/row';
import { BridgeFeeRow, BridgeFeeRowProps } from './bridge-fee-row';

jest.mock('../../../hooks/pay/useTransactionPayData');

const mockStore = configureMockStore([]);

function render(
  props: BridgeFeeRowProps = {},
  state: Record<string, unknown> = getMockPersonalSignConfirmState(),
) {
  return renderWithConfirmContextProvider(
    <BridgeFeeRow {...props} />,
    mockStore(state),
  );
}

function getPerpsWithdrawState() {
  const base = genUnapprovedContractInteractionConfirmation({ chainId: '0x1' });
  const withdraw = {
    ...base,
    type: TransactionType.perpsWithdraw,
    origin: 'metamask',
  };
  return getMockConfirmStateForTransaction(withdraw);
}

describe('BridgeFeeRow', () => {
  const useTransactionPayTotalsMock = jest.mocked(useTransactionPayTotals);
  const useTransactionPayQuotesMock = jest.mocked(useTransactionPayQuotes);
  const useIsTransactionPayLoadingMock = jest.mocked(
    useIsTransactionPayLoading,
  );
  beforeEach(() => {
    jest.resetAllMocks();

    useTransactionPayTotalsMock.mockReturnValue({
      fees: {
        provider: { usd: '1.00' },
        sourceNetwork: { estimate: { usd: '0.20' } },
        targetNetwork: { usd: '0.03' },
      },
    } as TransactionPayTotals);

    useIsTransactionPayLoadingMock.mockReturnValue(false);

    useTransactionPayQuotesMock.mockReturnValue([
      {} as TransactionPayQuote<Json>,
    ]);
  });

  it('renders skeleton with label when loading (Default variant)', () => {
    useIsTransactionPayLoadingMock.mockReturnValue(true);

    const { getByTestId, queryByTestId, getByText } = render();

    expect(getByTestId('bridge-fee-row-skeleton')).toBeInTheDocument();
    expect(queryByTestId('metamask-fee-row-skeleton')).not.toBeInTheDocument();
    expect(getByText(messages.transactionFee.message)).toBeInTheDocument();
  });

  it('renders bridge fee skeleton only when loading (Small variant)', () => {
    useIsTransactionPayLoadingMock.mockReturnValue(true);

    const { getByTestId, queryByTestId, queryByText } = render({
      variant: ConfirmInfoRowSize.Small,
    });

    expect(getByTestId('bridge-fee-row-skeleton')).toBeInTheDocument();
    expect(queryByTestId('metamask-fee-row-skeleton')).not.toBeInTheDocument();
    expect(
      queryByText(messages.transactionFee.message),
    ).not.toBeInTheDocument();
    expect(queryByText(messages.metamaskFee.message)).not.toBeInTheDocument();
  });

  it('does not render metamask fee body row (Default variant)', () => {
    const { getByTestId, queryByTestId } = render();

    expect(getByTestId('bridge-fee-row')).toBeInTheDocument();
    expect(queryByTestId('metamask-fee-row')).not.toBeInTheDocument();
  });

  it('does not render metamask fee body row (Small variant)', () => {
    const { getByTestId, queryByTestId } = render({
      variant: ConfirmInfoRowSize.Small,
    });

    expect(getByTestId('bridge-fee-row')).toBeInTheDocument();
    expect(queryByTestId('metamask-fee-row')).not.toBeInTheDocument();
  });

  it('renders tooltip with network and bridge fee only for Default variant (no MetaMask row)', async () => {
    const user = userEvent.setup();
    const { getByTestId, findByText } = render();

    await user.hover(getByTestId('bridge-fee-row-tooltip'));

    const tooltip = await findByText((content) =>
      content.includes(`${messages.networkFee.message}:`),
    );
    expect(
      tooltip.textContent?.startsWith(`${messages.networkFee.message}:`),
    ).toBe(true);
    expect(tooltip.textContent).toContain(`${messages.bridgeFee.message}:`);
    expect(tooltip.textContent).not.toContain(
      `${messages.metamaskFee.message}:`,
    );
  });

  it('renders tooltip with network, bridge, and metamask fee for Small variant', async () => {
    const user = userEvent.setup();
    const { getByTestId, findByText } = render({
      variant: ConfirmInfoRowSize.Small,
    });

    await user.hover(getByTestId('bridge-fee-row-tooltip'));

    const tooltip = await findByText((content) =>
      content.includes(`${messages.networkFee.message}:`),
    );
    expect(tooltip.textContent).toContain(`${messages.bridgeFee.message}:`);
    expect(tooltip.textContent).toContain(`${messages.metamaskFee.message}:`);
  });

  it('renders rich tooltip with description and fee labels when tooltipDescription is set', async () => {
    const user = userEvent.setup();
    const { getByTestId, findByText } = render({
      variant: ConfirmInfoRowSize.Small,
      tooltipDescription: messages.musdConversionFeeTooltipDescription.message,
    });

    await user.hover(getByTestId('bridge-fee-row-tooltip'));

    const tooltip = await findByText((content) =>
      content.includes(messages.musdConversionFeeTooltipDescription.message),
    );
    expect(tooltip.textContent).toContain(
      `${messages.musdConversionFeeTooltipDescription.message}\n\n${messages.networkFee.message}:`,
    );
    expect(tooltip.textContent).toContain(`${messages.bridgeFee.message}:`);
    expect(tooltip.textContent).toContain(`${messages.metamaskFee.message}:`);
  });

  it('does not render metamask fee if no quotes (Small variant)', () => {
    useTransactionPayQuotesMock.mockReturnValue([]);

    const { getByTestId, queryByTestId } = render({
      variant: ConfirmInfoRowSize.Small,
    });

    expect(getByTestId('bridge-fee-row')).toBeInTheDocument();
    expect(queryByTestId('metamask-fee-row')).not.toBeInTheDocument();
  });

  it('does not render a transaction fee tooltip when there are no quotes', () => {
    useTransactionPayQuotesMock.mockReturnValue([]);

    const { getByTestId, queryByTestId } = render();

    expect(getByTestId('bridge-fee-row')).toBeInTheDocument();
    expect(queryByTestId('bridge-fee-row-tooltip')).not.toBeInTheDocument();
  });

  it('renders fee value with ConfirmInfoRowText for Default variant', () => {
    const { getByTestId } = render();

    const feeValue = getByTestId('transaction-fee-value');
    expect(feeValue).toBeInTheDocument();
    expect(feeValue).toHaveTextContent('$1.23');
  });

  it('renders fee value with Text component for Small variant', () => {
    const { getByTestId } = render({
      variant: ConfirmInfoRowSize.Small,
    });

    const feeValue = getByTestId('transaction-fee-value');
    expect(feeValue).toBeInTheDocument();
    expect(feeValue).toHaveTextContent('$1.23');
  });

  it('renders Provider Fee label for perpsWithdraw transactions', () => {
    const { getByText, queryByText } = render({}, getPerpsWithdrawState());

    expect(getByText(messages.perpsWithdrawFee.message)).toBeInTheDocument();
    expect(
      queryByText(messages.transactionFee.message),
    ).not.toBeInTheDocument();
  });

  it('renders Transaction fee label for non-perpsWithdraw transactions', () => {
    const { getByText, queryByText } = render();

    expect(getByText(messages.transactionFee.message)).toBeInTheDocument();
    expect(
      queryByText(messages.perpsWithdrawFee.message),
    ).not.toBeInTheDocument();
  });

  it('renders Provider Fee label on the skeleton while loading a perpsWithdraw transaction', () => {
    useIsTransactionPayLoadingMock.mockReturnValue(true);

    const { getByTestId, getByText } = render({}, getPerpsWithdrawState());

    expect(getByTestId('bridge-fee-row-skeleton')).toBeInTheDocument();
    expect(getByText(messages.perpsWithdrawFee.message)).toBeInTheDocument();
  });
});
