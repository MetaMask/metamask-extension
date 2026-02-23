import React from 'react';
import configureMockStore from 'redux-mock-store';
import type { TransactionPayRequiredToken } from '@metamask/transaction-pay-controller';
import { getMockPersonalSignConfirmState } from '../../../../../../test/data/confirmations/helper';
import { renderWithConfirmContextProvider } from '../../../../../../test/lib/confirmations/render-helpers';
import { useTransactionPayRequiredTokens } from '../../../hooks/pay/useTransactionPayData';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useFiatFormatter } from '../../../../../hooks/useFiatFormatter';
import { ConfirmInfoRowSize } from '../../../../../components/app/confirm/info/row/row';
import {
  RequiredTokensRow,
  RequiredTokensRowProps,
} from './required-tokens-row';

jest.mock('../../../hooks/pay/useTransactionPayData');
jest.mock('../../../../../hooks/useI18nContext');
jest.mock('../../../../../hooks/useFiatFormatter');
jest.mock('../../simulation-details/amount-pill', () => ({
  AmountPill: ({ amount }: { amount: { toString: () => string } }) => (
    <div data-testid="simulation-details-amount-pill">{amount.toString()}</div>
  ),
}));
jest.mock('../../simulation-details/asset-pill', () => ({
  AssetPill: ({ asset }: { asset: { address: string } }) => (
    <div data-testid="simulation-details-asset-pill">{asset.address}</div>
  ),
}));

const mockStore = configureMockStore([]);

function render(props: RequiredTokensRowProps = {}) {
  const state = getMockPersonalSignConfirmState();
  return renderWithConfirmContextProvider(
    <RequiredTokensRow {...props} />,
    mockStore(state),
  );
}

function createMockRequiredToken(
  overrides: Partial<TransactionPayRequiredToken> = {},
): TransactionPayRequiredToken {
  return {
    address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    allowUnderMinimum: false,
    amountFiat: '$1.00',
    amountHuman: '1.00',
    amountRaw: '1000000',
    amountUsd: '1.00',
    balanceFiat: '$100.00',
    balanceHuman: '100.00',
    balanceRaw: '100000000',
    balanceUsd: '100.00',
    chainId: '0x1',
    decimals: 6,
    skipIfBalance: false,
    symbol: 'USDC',
    ...overrides,
  };
}

describe('RequiredTokensRow', () => {
  const useTransactionPayRequiredTokensMock = jest.mocked(
    useTransactionPayRequiredTokens,
  );
  const useI18nContextMock = jest.mocked(useI18nContext);
  const useFiatFormatterMock = jest.mocked(useFiatFormatter);

  beforeEach(() => {
    jest.resetAllMocks();

    useI18nContextMock.mockReturnValue(((key: string) => {
      const translations: Record<string, string> = {
        requiredToken: 'Required token',
      };
      return translations[key] ?? key;
    }) as ReturnType<typeof useI18nContext>);

    useFiatFormatterMock.mockReturnValue(
      (value: number) => `$${value.toFixed(2)}`,
    );

    useTransactionPayRequiredTokensMock.mockReturnValue([]);
  });

  it('renders nothing when no required tokens', () => {
    useTransactionPayRequiredTokensMock.mockReturnValue([]);

    const { container } = render();

    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when required tokens is undefined', () => {
    useTransactionPayRequiredTokensMock.mockReturnValue(
      undefined as unknown as TransactionPayRequiredToken[],
    );

    const { container } = render();

    expect(container).toBeEmptyDOMElement();
  });

  it('renders required token row with token details', () => {
    const mockToken = createMockRequiredToken();

    useTransactionPayRequiredTokensMock.mockReturnValue([mockToken]);

    const { getByTestId, getByText } = render();

    expect(getByTestId('required-tokens-row')).toBeInTheDocument();
    expect(getByText('Required token')).toBeInTheDocument();
    expect(getByTestId('simulation-details-amount-pill')).toHaveTextContent(
      '-1',
    );
    expect(getByTestId('simulation-details-asset-pill')).toBeInTheDocument();
  });

  it('renders asset pill with correct props', () => {
    const mockToken = createMockRequiredToken();

    useTransactionPayRequiredTokensMock.mockReturnValue([mockToken]);

    const { getByTestId } = render();

    const assetPill = getByTestId('simulation-details-asset-pill');
    expect(assetPill).toHaveTextContent(
      '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    );
  });

  it('renders multiple required tokens', () => {
    const mockTokens: TransactionPayRequiredToken[] = [
      createMockRequiredToken(),
      createMockRequiredToken({
        chainId: '0x89',
        address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
        amountHuman: '2.00',
        amountUsd: '2.00',
      }),
    ];

    useTransactionPayRequiredTokensMock.mockReturnValue(mockTokens);

    const { getAllByTestId } = render();

    expect(getAllByTestId('required-tokens-row')).toHaveLength(2);
    expect(getAllByTestId('simulation-details-asset-pill')).toHaveLength(2);
  });

  it('hides tokens with skipIfBalance true', () => {
    const mockToken = createMockRequiredToken({
      skipIfBalance: true,
    });

    useTransactionPayRequiredTokensMock.mockReturnValue([mockToken]);

    const { container } = render();

    expect(container).toBeEmptyDOMElement();
  });

  it('only renders tokens without skipIfBalance', () => {
    const mockTokens: TransactionPayRequiredToken[] = [
      createMockRequiredToken({ skipIfBalance: true }),
      createMockRequiredToken({
        chainId: '0x89',
        address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
        skipIfBalance: false,
      }),
    ];

    useTransactionPayRequiredTokensMock.mockReturnValue(mockTokens);

    const { getAllByTestId } = render();

    expect(getAllByTestId('required-tokens-row')).toHaveLength(1);
  });

  it('shows fiat amount for Default variant', () => {
    const mockToken = createMockRequiredToken();

    useTransactionPayRequiredTokensMock.mockReturnValue([mockToken]);

    const { getByText } = render();

    expect(getByText('$1.00')).toBeInTheDocument();
  });

  it('hides fiat amount for Small variant', () => {
    const mockToken = createMockRequiredToken();

    useTransactionPayRequiredTokensMock.mockReturnValue([mockToken]);

    const { queryByText } = render({
      variant: ConfirmInfoRowSize.Small,
    });

    expect(queryByText('$1.00')).not.toBeInTheDocument();
  });
});
