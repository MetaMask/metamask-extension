import React from 'react';
import configureMockStore from 'redux-mock-store';
import { QuoteResponse } from '@metamask/bridge-controller';

import { CHAIN_IDS, GasFeeToken } from '@metamask/transaction-controller';
import { Hex } from '@metamask/utils';
import { getMockConfirmStateForTransaction } from '../../../../../../../../test/data/confirmations/helper';
import { renderWithConfirmContextProvider } from '../../../../../../../../test/lib/confirmations/render-helpers';
import { GAS_FEE_TOKEN_MOCK } from '../../../../../../../../test/data/confirmations/gas';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../../../../test/data/confirmations/contract-interaction';
import { enLocale as messages } from '../../../../../../../../test/lib/i18n-helpers';
import * as DappSwapContext from '../../../../../context/dapp-swap';
import { useEstimationFailed } from '../../../../../hooks/gas/useEstimationFailed';
import { useGasSponsorshipEligibility } from '../../../../../hooks/gas/useGasSponsorshipEligibility';
import { EditGasFeesRow } from './edit-gas-fees-row';

jest.mock('../../../../../hooks/gas/useEstimationFailed');
jest.mock('../../../../../hooks/gas/useGasSponsorshipEligibility');

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

const mockUseEstimationFailed = jest.mocked(useEstimationFailed);
const mockUseGasSponsorshipEligibility = jest.mocked(
  useGasSponsorshipEligibility,
);

function render({
  chainId = CHAIN_IDS.GOERLI,
  gasFeeTokens,
  selectedGasFeeToken,
  fiatFee = '$1',
  nativeFee = '0.001 ETH',
  estimationFailed = false,
  isGasSponsorshipEligible = false,
  isMetaMaskSponsored = false,
}: {
  chainId?: Hex;
  gasFeeTokens?: GasFeeToken[];
  selectedGasFeeToken?: Hex;
  fiatFee?: string;
  nativeFee?: string;
  estimationFailed?: boolean;
  isGasSponsorshipEligible?: boolean;
  isMetaMaskSponsored?: boolean;
} = {}) {
  mockUseEstimationFailed.mockReturnValue(estimationFailed);
  mockUseGasSponsorshipEligibility.mockReturnValue({
    campaignName: 'Confirmations team',
    isEligible: isGasSponsorshipEligible,
  } as unknown as ReturnType<typeof useGasSponsorshipEligibility>);

  const state = getMockConfirmStateForTransaction(
    genUnapprovedContractInteractionConfirmation({
      chainId,
      gasFeeTokens,
      selectedGasFeeToken,
      isGasFeeSponsored: isMetaMaskSponsored,
    }),
  );

  const mockStore = configureMockStore()(state);

  return renderWithConfirmContextProvider(
    <EditGasFeesRow
      fiatFee={fiatFee}
      nativeFee={nativeFee}
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

  describe('estimationFailed', () => {
    it('renders "Unavailable" when estimation failed', () => {
      const { getByText, queryByTestId } = render({
        estimationFailed: true,
      });

      expect(getByText(messages.unavailable.message)).toBeInTheDocument();
      expect(queryByTestId('native-currency')).toBeNull();
      expect(queryByTestId('first-gas-field')).toBeNull();
    });

    it('does not render "Unavailable" when estimation has not failed', () => {
      const { queryByText } = render({
        estimationFailed: false,
      });

      expect(queryByText(messages.unavailable.message)).toBeNull();
    });

    it('does not render "Unavailable" when gas fee is sponsored even if estimation failed', () => {
      const { queryByText, getByTestId } = render({
        estimationFailed: true,
        isGasSponsorshipEligible: true,
      });

      expect(queryByText(messages.unavailable.message)).toBeNull();
      expect(getByTestId('paid-by-sponsor')).toBeInTheDocument();
    });

    it('renders Paid by MetaMask when existing sponsorship flag is true', () => {
      const { getByTestId, getByText } = render({
        isMetaMaskSponsored: true,
        isGasSponsorshipEligible: false,
      });

      expect(getByTestId('paid-by-sponsor')).toBeInTheDocument();
      expect(getByText('Paid by MetaMask')).toBeInTheDocument();
    });
  });
});
