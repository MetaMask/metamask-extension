import React from 'react';
import configureMockStore from 'redux-mock-store';
import { QuoteResponse } from '@metamask/bridge-controller';

import { CHAIN_IDS, GasFeeToken } from '@metamask/transaction-controller';
import { Hex } from '@metamask/utils';
import { getMockConfirmStateForTransaction } from '../../../../../../../../test/data/confirmations/helper';
import { renderWithConfirmContextProvider } from '../../../../../../../../test/lib/confirmations/render-helpers';
import { GAS_FEE_TOKEN_MOCK } from '../../../../../../../../test/data/confirmations/gas';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../../../../test/data/confirmations/contract-interaction';
import * as DappSwapContext from '../../../../../context/dapp-swap';
import { EditGasFeesRow } from './edit-gas-fees-row';

jest.mock('../../../../simulation-details/useBalanceChanges', () => ({
  useBalanceChanges: jest.fn(() => ({ pending: false, value: [] })),
}));

jest.mock(
  '../../../../../../../components/app/alert-system/contexts/alertMetricsContext',
  () => ({
    useAlertMetrics: jest.fn(() => ({
      trackAlertMetrics: jest.fn(),
    })),
  }),
);

function render({
  chainId = CHAIN_IDS.GOERLI,
  gasFeeTokens,
  selectedGasFeeToken,
}: {
  chainId?: Hex;
  gasFeeTokens?: GasFeeToken[];
  selectedGasFeeToken?: Hex;
} = {}) {
  const state = getMockConfirmStateForTransaction(
    genUnapprovedContractInteractionConfirmation({
      chainId,
      gasFeeTokens,
      selectedGasFeeToken,
    }),
  );

  const mockStore = configureMockStore()(state);

  return renderWithConfirmContextProvider(
    <EditGasFeesRow
      fiatFee="$1"
      nativeFee="0.001 ETH"
      fiatFeeWith18SignificantDigits="0.001234"
    />,
    mockStore,
  );
}

describe('<EditGasFeesRow />', () => {
  it('renders component', () => {
    const { container } = render();
    expect(container).toMatchSnapshot();
  });

  it('renders metamask fee and falls back to transaction fiat fee when selected gas fee token fiat is empty', () => {
    const gasFeeTokenWithoutFiat = {
      ...GAS_FEE_TOKEN_MOCK,
      amountFiat: '',
    };

    const { getByTestId } = render({
      chainId: CHAIN_IDS.MAINNET,
      gasFeeTokens: [gasFeeTokenWithoutFiat],
      selectedGasFeeToken: gasFeeTokenWithoutFiat.tokenAddress,
    });

    expect(getByTestId('gas-fee-token-fee')).toBeInTheDocument();
    expect(getByTestId('native-currency')).toHaveTextContent('$1');
  });

  it('renders edit gas fee button', () => {
    const { getByTestId } = render({
      gasFeeTokens: undefined,
      selectedGasFeeToken: undefined,
    });

    expect(getByTestId('edit-gas-fee-icon')).toBeInTheDocument();
  });

  it('does not renders edit gas fee button for quote suggested swap', () => {
    jest.spyOn(DappSwapContext, 'useDappSwapContext').mockReturnValue({
      isQuotedSwapDisplayedInInfo: true,
      selectedQuote: {} as unknown as QuoteResponse,
      setSelectedQuote: jest.fn(),
      setQuotedSwapDisplayedInInfo: jest.fn(),
    } as unknown as ReturnType<typeof DappSwapContext.useDappSwapContext>);
    const { queryByTestId } = render({
      gasFeeTokens: undefined,
      selectedGasFeeToken: undefined,
    });

    expect(queryByTestId('edit-gas-fee-icon')).toBeNull();
  });
});
