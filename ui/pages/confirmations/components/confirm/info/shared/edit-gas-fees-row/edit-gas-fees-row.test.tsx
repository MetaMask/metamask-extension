import React from 'react';
import { act, fireEvent } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import { QuoteResponseV1 } from '@metamask/bridge-controller';

import {
  CHAIN_IDS,
  GasFeeToken,
  TransactionType,
} from '@metamask/transaction-controller';
import { Hex } from '@metamask/utils';
import { getMockConfirmStateForTransaction } from '../../../../../../../../test/data/confirmations/helper';
import { renderWithConfirmContextProvider } from '../../../../../../../../test/lib/confirmations/render-helpers';
import { GAS_FEE_TOKEN_MOCK } from '../../../../../../../../test/data/confirmations/gas';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../../../../test/data/confirmations/contract-interaction';
import { enLocale as messages } from '../../../../../../../../test/lib/i18n-helpers';
import * as DappSwapContext from '../../../../../context/dapp-swap';
import { useEstimationFailed } from '../../../../../hooks/gas/useEstimationFailed';
import { useIsGaslessSupported } from '../../../../../hooks/gas/useIsGaslessSupported';
import { EditGasFeesRow } from './edit-gas-fees-row';

jest.mock('../../../../../hooks/gas/useEstimationFailed');
jest.mock('../../../../../hooks/gas/useIsGaslessSupported');
jest.mock('../../../../../../../hooks/usePolling', () => jest.fn());

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
const mockUseIsGaslessSupported = jest.mocked(useIsGaslessSupported);

function render({
  chainId = CHAIN_IDS.GOERLI,
  gasFeeTokens,
  selectedGasFeeToken,
  addedProtectionFeeFiat,
  showAddedProtectionFee,
  fiatFee = '$1',
  nativeFee = '0.001 ETH',
  estimationFailed = false,
  isGaslessSupported = false,
  isSponsorshipOptedOut = false,
  showFiatInTestnets = false,
  transactionType,
}: {
  addedProtectionFeeFiat?: string;
  showAddedProtectionFee?: boolean;
  chainId?: Hex;
  gasFeeTokens?: GasFeeToken[];
  selectedGasFeeToken?: Hex;
  fiatFee?: string;
  nativeFee?: string;
  estimationFailed?: boolean;
  isGaslessSupported?: boolean;
  isSponsorshipOptedOut?: boolean;
  showFiatInTestnets?: boolean;
  transactionType?: TransactionType;
} = {}) {
  mockUseEstimationFailed.mockReturnValue(estimationFailed);
  mockUseIsGaslessSupported.mockReturnValue({
    isSupported: isGaslessSupported,
    isSmartTransaction: false,
    pending: false,
  });

  const confirmation = genUnapprovedContractInteractionConfirmation({
    chainId,
    gasFeeTokens,
    selectedGasFeeToken,
    isGasFeeSponsored: isGaslessSupported,
  });

  if (transactionType) {
    confirmation.type = transactionType;
  }

  const state = getMockConfirmStateForTransaction(confirmation, {
    metamask: {
      preferences: {
        showFiatInTestnets,
        gasSponsorshipOptOutByChainId: { [chainId]: isSponsorshipOptedOut },
      },
    },
  });

  const mockStore = configureMockStore()(state);

  return renderWithConfirmContextProvider(
    <EditGasFeesRow
      addedProtectionFeeFiat={addedProtectionFeeFiat}
      showAddedProtectionFee={showAddedProtectionFee}
      fiatFee={fiatFee}
      nativeFee={nativeFee}
      fiatFeeWith18SignificantDigits="0.001234"
    />,
    mockStore,
  );
}

describe('<EditGasFeesRow />', () => {
  it('does not render added protection network fee when fiat is hidden on testnets', () => {
    const { container, queryByTestId } = render({
      chainId: CHAIN_IDS.SEPOLIA,
      addedProtectionFeeFiat: '$0.07',
      showAddedProtectionFee: true,
    });

    expect(queryByTestId('added-protection-network-fee')).toBeNull();
    expect(container).toMatchSnapshot();
  });

  it('renders metamask fee and falls back to transaction fiat fee when selected gas fee token fiat is empty', () => {
    const gasFeeTokenWithoutFiat = {
      ...GAS_FEE_TOKEN_MOCK,
      amountFiat: '',
    };

    const { getByTestId, getByText } = render({
      chainId: CHAIN_IDS.MAINNET,
      gasFeeTokens: [gasFeeTokenWithoutFiat],
      selectedGasFeeToken: gasFeeTokenWithoutFiat.tokenAddress,
      addedProtectionFeeFiat: '$0.07',
      showAddedProtectionFee: true,
    });

    expect(getByTestId('gas-fee-token-fee')).toBeInTheDocument();
    expect(getByTestId('native-currency')).toHaveTextContent('$1');
    expect(
      getByText(
        messages.addedProtectionIncludesNetworkFee.message.replace(
          '$1',
          '$0.07',
        ),
      ),
    ).toBeInTheDocument();
  });

  it('renders edit gas fee button', () => {
    const { getByTestId, getByText } = render({
      gasFeeTokens: undefined,
      selectedGasFeeToken: undefined,
      fiatFee: '$12.34',
      showAddedProtectionFee: true,
      showFiatInTestnets: true,
    });

    expect(getByTestId('edit-gas-fee-icon')).toBeInTheDocument();
    expect(
      getByText(
        messages.addedProtectionIncludesNetworkFee.message.replace(
          '$1',
          '$0.00',
        ),
      ),
    ).toBeInTheDocument();
    expect(() =>
      getByText(
        messages.addedProtectionIncludesNetworkFee.message.replace(
          '$1',
          '$12.34',
        ),
      ),
    ).toThrow();
  });

  it('does not renders edit gas fee button for quote suggested swap', () => {
    jest.spyOn(DappSwapContext, 'useDappSwapContext').mockReturnValue({
      isQuotedSwapDisplayedInInfo: true,
      selectedQuote: {} as unknown as QuoteResponseV1,
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
        isGaslessSupported: true,
      });

      expect(queryByText(messages.unavailable.message)).toBeNull();
      expect(getByTestId('paid-by-meta-mask')).toBeInTheDocument();
    });
  });

  describe('sponsor', () => {
    const UNISWAP_SPONSORED_GAS_FEE_TOKEN_MOCK = {
      ...GAS_FEE_TOKEN_MOCK,
      sponsor: 'Uniswap',
    };

    const METAMASK_SPONSORED_GAS_FEE_TOKEN_MOCK = {
      ...GAS_FEE_TOKEN_MOCK,
      sponsor: 'MetaMask',
    };

    it('renders the sponsor name and tooltip when gas fee is sponsored by a third party', () => {
      const { container, getByTestId } = render({
        gasFeeTokens: [UNISWAP_SPONSORED_GAS_FEE_TOKEN_MOCK],
        isGaslessSupported: true,
      });

      expect(getByTestId('paid-by-meta-mask')).toHaveTextContent(
        'Paid by Uniswap',
      );
      expect(
        container.querySelector(
          `[data-original-title="${messages.gasSponsorshipSponsorTooltip.message.replace(
            '$1',
            'Uniswap',
          )}"]`,
        ),
      ).toBeInTheDocument();
    });

    it('passes the sponsor to the gas sponsorship modal', async () => {
      const { getAllByText, getByTestId } = render({
        gasFeeTokens: [UNISWAP_SPONSORED_GAS_FEE_TOKEN_MOCK],
        isGaslessSupported: true,
      });

      await act(async () => {
        fireEvent.click(getByTestId('paid-by-meta-mask'));
      });

      expect(getAllByText('Paid by Uniswap')).toHaveLength(2);
    });

    it('renders "Paid by MetaMask" and the MetaMask tooltip when the sponsor is MetaMask', () => {
      const { container, getByTestId } = render({
        gasFeeTokens: [METAMASK_SPONSORED_GAS_FEE_TOKEN_MOCK],
        isGaslessSupported: true,
      });

      expect(getByTestId('paid-by-meta-mask')).toHaveTextContent(
        messages.paidByMetaMask.message,
      );
      expect(
        container.querySelector(
          `[data-original-title="${messages.gasSponsorshipOptOutTooltip.message}"]`,
        ),
      ).toBeInTheDocument();
    });

    it('renders "Paid by MetaMask" when gas fee tokens have no sponsor', () => {
      const { getByTestId } = render({
        gasFeeTokens: [GAS_FEE_TOKEN_MOCK],
        isGaslessSupported: true,
      });

      expect(getByTestId('paid-by-meta-mask')).toHaveTextContent(
        messages.paidByMetaMask.message,
      );
    });

    it('does not render the sponsor when gas fee is not sponsored', () => {
      const { queryByText } = render({
        gasFeeTokens: [UNISWAP_SPONSORED_GAS_FEE_TOKEN_MOCK],
        isGaslessSupported: false,
      });

      expect(queryByText('Paid by Uniswap')).toBeNull();
    });

    it('does not render the sponsor when the user opted out of sponsorship', () => {
      const { container, queryByTestId } = render({
        gasFeeTokens: [UNISWAP_SPONSORED_GAS_FEE_TOKEN_MOCK],
        isGaslessSupported: true,
        isSponsorshipOptedOut: true,
      });

      expect(queryByTestId('paid-by-meta-mask')).toBeNull();
      expect(
        container.querySelector(
          `[data-original-title="${messages.estimatedFeeTooltip.message}"]`,
        ),
      ).toBeInTheDocument();
    });
  });

  it('does not render "Paid by MetaMask" pill for revokeDelegation even on sponsored networks', () => {
    const { queryByTestId } = render({
      isGaslessSupported: true,
      transactionType: TransactionType.revokeDelegation,
    });

    expect(queryByTestId('paid-by-meta-mask')).toBeNull();
  });
});
