import React from 'react';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { TransactionMeta } from '@metamask/transaction-controller';
import { BigNumber } from 'bignumber.js';
import {
  EditGasModes,
  GasEstimateTypes,
} from '../../../../shared/constants/gas';
import { useTransactionModalContext } from '../../../contexts/transaction-modal';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../store/store';
import mockEstimates from '../../../../test/data/mock-estimates.json';
import mockState from '../../../../test/data/mock-state.json';
import { decGWEIToHexWEI } from '../../../../shared/modules/conversion.utils';
import { getSelectedInternalAccountFromMockState } from '../../../../test/jest/mocks';
import {
  createCancelTransaction,
  createSpeedUpTransaction,
} from '../../../store/actions';
import { MetaMaskReduxState } from '../../../selectors';
import { tEn } from '../../../../test/lib/i18n-helpers';
import { CancelSpeedup } from './cancel-speedup';

jest.mock('../../../store/actions', () => ({
  gasFeeStartPollingByNetworkClientId: jest
    .fn()
    .mockResolvedValue('pollingToken'),
  gasFeeStopPollingByPollingToken: jest.fn(),
  getNetworkConfigurationByNetworkClientId: jest.fn().mockImplementation(() =>
    Promise.resolve({
      chainId: '0x5',
    }),
  ),
  getGasFeeTimeEstimate: jest.fn().mockImplementation(() => Promise.resolve()),
  addPollingTokenToAppState: jest.fn(),
  removePollingTokenFromAppState: jest.fn(),
  updateTransactionGasFees: () => ({ type: 'UPDATE_TRANSACTION_PARAMS' }),
  updatePreviousGasParams: () => ({ type: 'UPDATE_TRANSACTION_PARAMS' }),
  createTransactionEventFragment: jest.fn(),
  createSpeedUpTransaction: jest.fn(() => ({ type: 'SPEED_UP_TRANSACTION' })),
  createCancelTransaction: jest.fn(() => ({ type: 'CANCEL_TRANSACTION' })),
}));

jest.mock('../../../contexts/transaction-modal', () => ({
  useTransactionModalContext: jest.fn(),
}));

const mockOpenGasFeeModal = jest.fn();
jest.mock('../context/gas-fee-modal', () => ({
  GasFeeModalContextProvider: ({ children }: { children: React.ReactNode }) =>
    children,
  GasFeeModalWrapper: () => null,
  useGasFeeModalContext: () => ({
    openGasFeeModal: mockOpenGasFeeModal,
    closeGasFeeModal: jest.fn(),
  }),
}));

const mockSelectedInternalAccount = getSelectedInternalAccountFromMockState(
  mockState as unknown as MetaMaskReduxState,
);

const MOCK_SUGGESTED_MEDIUM_MAXFEEPERGAS_DEC_GWEI =
  mockEstimates[GasEstimateTypes.feeMarket].gasFeeEstimates.medium
    .suggestedMaxFeePerGas; // 10 GWEI in decimal
const MOCK_SUGGESTED_MEDIUM_MAXFEEPERGAS_BN_WEI = new BigNumber(
  decGWEIToHexWEI(MOCK_SUGGESTED_MEDIUM_MAXFEEPERGAS_DEC_GWEI),
  16,
); // converting to hex WEI and then to BN for calculations

const MOCK_SUGGESTED_MEDIUM_MAXFEEPERGAS_HEX_WEI =
  MOCK_SUGGESTED_MEDIUM_MAXFEEPERGAS_BN_WEI.toString(16); // 70 GWEI in hex WEI (from mock medium)

// Network fee row shows 4 decimals. estimatedFee (wei) = minimumFeePerGas × gasLimit; display = fee/1e18 round 4.
// Above medium (10%): effective 110 GWEI × 20909 gas = 2.29999e15 wei → "0.0023".
// useFeeCalculations uses min(estimatedBaseFee + maxPriorityFeePerGas, maxFeePerGas); mock base = 50 GWEI.
const GAS_LIMIT_ABOVE_MEDIUM = '0x51AD'; // 20909
const MAXFEEPERGAS_110_GWEI_HEX = '0x19a8142800'; // 110 GWEI in hex WEI
const MAXPRIORITYFEE_60_GWEI_HEX = '0xdf8475800'; // 60 GWEI so 50+60 ≥ 110
const EXPECTED_ETH_FEE_ABOVE_MEDIUM_10_PCT = '0.0023';

// Below medium: effective 75 GWEI × 20000 gas = 1.5e15 wei → "0.0015". Mock base = 50, so priority ≥ 25.
const GAS_LIMIT_BELOW_MEDIUM = '0x4E20'; // 20000
const MAXFEEPERGAS_75_GWEI_HEX = '0x1172b83c00'; // 75 GWEI in hex WEI
const MAXPRIORITYFEE_25_GWEI_HEX = '0x5d21dba00'; // 25 GWEI so 50+25 = 75
const EXPECTED_ETH_FEE_MEDIUM = '0.0015';

const mockTransaction = {
  id: '1',
  chainId: '0x5',
  networkClientId: 'goerli',
  userFeeLevel: 'tenPercentIncreased',
  previousGas: {
    maxFeePerGas: MOCK_SUGGESTED_MEDIUM_MAXFEEPERGAS_HEX_WEI,
    maxPriorityFeePerGas: '0x2540be400',
    gas: '0x5208',
  },
  txParams: {
    from: mockSelectedInternalAccount.address,
    gas: '0x5208',
    maxFeePerGas: MOCK_SUGGESTED_MEDIUM_MAXFEEPERGAS_HEX_WEI,
    maxPriorityFeePerGas: '0x2540be400',
  },
  gasLimitNoBuffer: '0x5208',
} as unknown as TransactionMeta;

describe('CancelSpeedup Component', () => {
  const mockCloseModal = jest.fn();
  const mockOpenModal = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    (useTransactionModalContext as jest.Mock).mockReturnValue({
      currentModal: 'cancelSpeedUpTransaction',
      closeModal: mockCloseModal,
      openModal: mockOpenModal,
    });
  });

  type RenderOptions = {
    maxFeePerGas?: string;
    maxPriorityFeePerGas?: string;
    gas?: string;
    gasLimitNoBuffer?: string;
    gasFeeEstimates?: (typeof mockEstimates)[GasEstimateTypes.feeMarket]['gasFeeEstimates'];
  };

  const render = (
    props: Partial<React.ComponentProps<typeof CancelSpeedup>> = {},
    options:
      | string
      | RenderOptions = MOCK_SUGGESTED_MEDIUM_MAXFEEPERGAS_HEX_WEI,
  ) => {
    const opts: RenderOptions =
      typeof options === 'string' ? { maxFeePerGas: options } : options;
    const {
      maxFeePerGas = MOCK_SUGGESTED_MEDIUM_MAXFEEPERGAS_HEX_WEI,
      maxPriorityFeePerGas,
      gas,
      gasLimitNoBuffer,
      gasFeeEstimates = mockEstimates[GasEstimateTypes.feeMarket]
        .gasFeeEstimates,
    } = opts;

    const store = configureStore({
      appState: {
        isLoading: false,
      },
      metamask: {
        ...mockState.metamask,
        isInitialized: true,
        accounts: {
          [mockSelectedInternalAccount.address]: {
            address: mockSelectedInternalAccount.address,
            balance: '0x1F4',
          },
        },
        preferences: {
          showFiatInTestnets: true,
        },
        featureFlags: { advancedInlineGas: true },
        gasFeeEstimates,
        gasFeeEstimatesByChainId: {
          ...mockState.metamask.gasFeeEstimatesByChainId,
          '0x5': {
            ...mockState.metamask.gasFeeEstimatesByChainId['0x5'],
            gasFeeEstimates,
          },
        },
      },
    });

    const effectiveGas = gas ?? mockTransaction.txParams.gas;
    const txParams = {
      ...mockTransaction.txParams,
      maxFeePerGas,
      gas: effectiveGas,
      ...(maxPriorityFeePerGas !== undefined && {
        maxPriorityFeePerGas,
      }),
    };

    const transaction = {
      ...mockTransaction,
      txParams,
      gasLimitNoBuffer: gasLimitNoBuffer ?? effectiveGas,
    } as TransactionMeta;

    return renderWithProvider(
      <CancelSpeedup
        transaction={transaction}
        editGasMode={EditGasModes.cancel}
        {...props}
      />,
      store,
    );
  };

  it('renders nothing if currentModal is not cancelSpeedUpTransaction', () => {
    (useTransactionModalContext as jest.Mock).mockReturnValue({
      currentModal: 'none',
    });

    const { container } = render();
    expect(container).toBeEmptyDOMElement();
  });

  it('renders correctly in Speed Up mode', async () => {
    render({ editGasMode: EditGasModes.speedUp });

    await waitFor(() => {
      expect(
        screen.getByText(tEn('speedUpTransactionTitle') as string),
      ).toBeInTheDocument();
    });

    expect(
      screen.getByText(tEn('speedUpTransactionDescription') as string),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('cancel-speedup-confirm-button'),
    ).toBeInTheDocument();
    expect(screen.getByText(tEn('networkFee') as string)).toBeInTheDocument();
    expect(screen.getByText(tEn('speed') as string)).toBeInTheDocument();
    expect(screen.getByTestId('gas-timing-time')).toBeInTheDocument();
  });

  it('renders correctly in Cancel mode', async () => {
    render({ editGasMode: EditGasModes.cancel });

    await waitFor(() => {
      expect(
        screen.getByText(tEn('cancelTransactionTitle') as string),
      ).toBeInTheDocument();
    });

    expect(
      screen.getByText(tEn('cancelTransactionDescription') as string),
    ).toBeInTheDocument();
  });

  it('calls speedUpTransaction and closes modal when confirming speed up', async () => {
    render({ editGasMode: EditGasModes.speedUp });

    await waitFor(() => {
      expect(
        screen.getByTestId('cancel-speedup-confirm-button'),
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('cancel-speedup-confirm-button'));

    await waitFor(() => {
      expect(createSpeedUpTransaction).toHaveBeenCalledTimes(1);
      expect(mockCloseModal).toHaveBeenCalledWith(['cancelSpeedUpTransaction']);
    });
  });

  it('calls cancelTransaction and closes modal when confirming cancel', async () => {
    render({ editGasMode: EditGasModes.cancel });

    await waitFor(() => {
      expect(
        screen.getByTestId('cancel-speedup-confirm-button'),
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('cancel-speedup-confirm-button'));

    await waitFor(() => {
      expect(createCancelTransaction).toHaveBeenCalledTimes(1);
      expect(mockCloseModal).toHaveBeenCalledWith(['cancelSpeedUpTransaction']);
    });
  });

  it('opens the edit gas modal when the edit icon is clicked', async () => {
    render({ editGasMode: EditGasModes.speedUp });

    await waitFor(() => {
      expect(screen.getByTestId('edit-gas-fee-icon')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('edit-gas-fee-icon'));

    await waitFor(() => {
      expect(mockOpenGasFeeModal).toHaveBeenCalledTimes(1);
    });
  });

  it('shows network fee 0.0023 ETH when above medium (110 GWEI × 20909 gas, 4 decimals)', async () => {
    // Base 50 + priority 60 → min 110 GWEI; 110e9 × 20909 = 0.0023 ETH.
    render(
      { editGasMode: EditGasModes.speedUp },
      {
        maxFeePerGas: MAXFEEPERGAS_110_GWEI_HEX,
        maxPriorityFeePerGas: MAXPRIORITYFEE_60_GWEI_HEX,
        gas: GAS_LIMIT_ABOVE_MEDIUM,
      },
    );

    await waitFor(() => {
      const row = screen.getByTestId('edit-gas-fees-row');
      expect(row).toHaveTextContent('ETH');
      expect(row).toHaveTextContent(EXPECTED_ETH_FEE_ABOVE_MEDIUM_10_PCT);
    });
  });

  it('shows network fee 0.0015 ETH when below medium (75 GWEI × 20000 gas, 4 decimals)', async () => {
    // Base 50 + priority 25 → min 75 GWEI; 75e9 × 20000 = 0.0015 ETH.
    render(
      { editGasMode: EditGasModes.speedUp },
      {
        maxFeePerGas: MAXFEEPERGAS_75_GWEI_HEX,
        maxPriorityFeePerGas: MAXPRIORITYFEE_25_GWEI_HEX,
        gas: GAS_LIMIT_BELOW_MEDIUM,
      },
    );

    await waitFor(() => {
      const row = screen.getByTestId('edit-gas-fees-row');
      expect(row).toHaveTextContent('ETH');
      expect(row).toHaveTextContent(EXPECTED_ETH_FEE_MEDIUM);
    });
  });
});
