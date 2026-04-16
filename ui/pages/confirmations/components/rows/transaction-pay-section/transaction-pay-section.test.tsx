import React from 'react';
import configureMockStore from 'redux-mock-store';
import { getMockPersonalSignConfirmState } from '../../../../../../test/data/confirmations/helper';
import { renderWithConfirmContextProvider } from '../../../../../../test/lib/confirmations/render-helpers';
import {
  useIsTransactionPayLoading,
  useTransactionPayRequiredTokens,
} from '../../../hooks/pay/useTransactionPayData';
import { useTransactionPayToken } from '../../../hooks/pay/useTransactionPayToken';
import { TransactionPaySection } from './transaction-pay-section';

jest.mock('../../../hooks/pay/useTransactionPayData');
jest.mock('../../../hooks/pay/useTransactionPayToken');

jest.mock('../pay-with-row/pay-with-row', () => ({
  PayWithRow: () => <div data-testid="pay-with-row">PayWithRow</div>,
}));

jest.mock('../bridge-fee-row/bridge-fee-row', () => ({
  BridgeFeeRow: () => <div data-testid="bridge-fee-row">BridgeFeeRow</div>,
}));

jest.mock('../total-row/total-row', () => ({
  TotalRow: () => <div data-testid="total-row">TotalRow</div>,
}));

jest.mock('../required-tokens-row', () => ({
  RequiredTokensRow: () => (
    <div data-testid="required-tokens-row">RequiredTokensRow</div>
  ),
}));

const mockStore = configureMockStore([]);

function render() {
  const state = getMockPersonalSignConfirmState();
  return renderWithConfirmContextProvider(
    <TransactionPaySection />,
    mockStore(state),
  );
}

describe('TransactionPaySection', () => {
  const useTransactionPayRequiredTokensMock = jest.mocked(
    useTransactionPayRequiredTokens,
  );
  const useIsTransactionPayLoadingMock = jest.mocked(
    useIsTransactionPayLoading,
  );
  const useTransactionPayTokenMock = jest.mocked(useTransactionPayToken);

  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetAllMocks();
    process.env = { ...originalEnv, MM_PAY_DAPPS_ENABLED: 'true' };

    useTransactionPayRequiredTokensMock.mockReturnValue([]);
    useIsTransactionPayLoadingMock.mockReturnValue(false);
    useTransactionPayTokenMock.mockReturnValue({
      payToken: undefined,
      setPayToken: jest.fn(),
      isNative: false,
    });
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('returns null when MM_PAY_DAPPS_ENABLED is not set', () => {
    process.env = { ...originalEnv };
    delete process.env.MM_PAY_DAPPS_ENABLED;

    const { container } = render();

    expect(container).toBeEmptyDOMElement();
  });

  it('returns null when MM_PAY_DAPPS_ENABLED is false', () => {
    process.env = { ...originalEnv, MM_PAY_DAPPS_ENABLED: 'false' };

    const { container } = render();

    expect(container).toBeEmptyDOMElement();
  });

  it('returns null when no required tokens and not loading', () => {
    useTransactionPayRequiredTokensMock.mockReturnValue([]);
    useIsTransactionPayLoadingMock.mockReturnValue(false);

    const { container } = render();

    expect(container).toBeEmptyDOMElement();
  });

  it('renders section when loading', () => {
    useIsTransactionPayLoadingMock.mockReturnValue(true);

    const { getByTestId } = render();

    expect(getByTestId('transaction-pay-section')).toBeInTheDocument();
    expect(getByTestId('required-tokens-row')).toBeInTheDocument();
    expect(getByTestId('pay-with-row')).toBeInTheDocument();
  });

  it('renders section when has required tokens', () => {
    useTransactionPayRequiredTokensMock.mockReturnValue([
      { chainId: '0x1', address: '0x123' },
    ] as never);

    const { getByTestId } = render();

    expect(getByTestId('transaction-pay-section')).toBeInTheDocument();
    expect(getByTestId('required-tokens-row')).toBeInTheDocument();
    expect(getByTestId('pay-with-row')).toBeInTheDocument();
  });

  it('does not render BridgeFeeRow and TotalRow when no payToken', () => {
    useTransactionPayRequiredTokensMock.mockReturnValue([
      { chainId: '0x1', address: '0x123' },
    ] as never);
    useTransactionPayTokenMock.mockReturnValue({
      payToken: undefined,
      setPayToken: jest.fn(),
      isNative: false,
    });

    const { getByTestId, queryByTestId } = render();

    expect(getByTestId('transaction-pay-section')).toBeInTheDocument();
    expect(queryByTestId('bridge-fee-row')).not.toBeInTheDocument();
    expect(queryByTestId('total-row')).not.toBeInTheDocument();
  });

  it('renders BridgeFeeRow and TotalRow when payToken exists', () => {
    useTransactionPayRequiredTokensMock.mockReturnValue([
      { chainId: '0x1', address: '0x123' },
    ] as never);
    useTransactionPayTokenMock.mockReturnValue({
      payToken: {
        chainId: '0x1',
        address: '0x456',
        symbol: 'ETH',
        balanceUsd: '100',
      },
      setPayToken: jest.fn(),
      isNative: true,
    } as never);

    const { getByTestId } = render();

    expect(getByTestId('transaction-pay-section')).toBeInTheDocument();
    expect(getByTestId('bridge-fee-row')).toBeInTheDocument();
    expect(getByTestId('total-row')).toBeInTheDocument();
  });
});
