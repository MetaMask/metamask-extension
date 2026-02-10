import React from 'react';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { TransactionMeta } from '@metamask/transaction-controller';
import {
  EditGasModes,
  GasEstimateTypes,
} from '../../../../shared/constants/gas';
import { useTransactionModalContext } from '../../../contexts/transaction-modal';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../store/store';
import mockEstimates from '../../../../test/data/mock-estimates.json';
import mockState from '../../../../test/data/mock-state.json';
import {
  decGWEIToHexWEI,
  hexWEIToDecETH,
} from '../../../../shared/modules/conversion.utils';
import { getSelectedInternalAccountFromMockState } from '../../../../test/jest/mocks';
import {
  createCancelTransaction,
  createSpeedUpTransaction,
} from '../../../store/actions';
import { MetaMaskReduxState } from '../../../selectors';
import { CancelSpeedup } from './cancel-speedup';
import BigNumber from 'bignumber.js';

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

const mockSelectedInternalAccount = getSelectedInternalAccountFromMockState(
  mockState as unknown as MetaMaskReduxState,
);

const MAXFEEPERGAS_ABOVE_MOCK_MEDIUM_HEX = '0x174876e800'; // 100 GWEI in hex WEI
const MAXGASCOST_ABOVE_MOCK_MEDIUM_BN = new BigNumber(
  MAXFEEPERGAS_ABOVE_MOCK_MEDIUM_HEX,
  16,
).times(21000, 10); // maxFeePerGas * gasLimit
const MAXGASCOST_ABOVE_MOCK_MEDIUM_BN_PLUS_TEN_PCT_HEX =
  MAXGASCOST_ABOVE_MOCK_MEDIUM_BN.times(1.1, 10).toString(16); // adding 10%

const EXPECTED_ETH_FEE_1 = hexWEIToDecETH(
  MAXGASCOST_ABOVE_MOCK_MEDIUM_BN_PLUS_TEN_PCT_HEX,
); // converting back to ETH for display

const MOCK_SUGGESTED_MEDIUM_MAXFEEPERGAS_DEC_GWEI =
  mockEstimates[GasEstimateTypes.feeMarket].gasFeeEstimates.medium
    .suggestedMaxFeePerGas; // 10 GWEI in decimal
const MOCK_SUGGESTED_MEDIUM_MAXFEEPERGAS_BN_WEI = new BigNumber(
  decGWEIToHexWEI(MOCK_SUGGESTED_MEDIUM_MAXFEEPERGAS_DEC_GWEI),
  16,
); // converting to hex WEI and then to BN for calculations
const MAXFEEPERGAS_BELOW_MOCK_MEDIUM_HEX =
  MOCK_SUGGESTED_MEDIUM_MAXFEEPERGAS_BN_WEI.div(10, 10).toString(16); // 1 GWEI in hex WEI, which is below the medium estimate

const EXPECTED_ETH_FEE_2 = hexWEIToDecETH(
  MOCK_SUGGESTED_MEDIUM_MAXFEEPERGAS_BN_WEI.times(21000, 10).toString(16),
); // expected fee when using the medium estimate (10 GWEI * 21000 gasLimit)

const MOCK_SUGGESTED_MEDIUM_MAXFEEPERGAS_HEX_WEI =
  MOCK_SUGGESTED_MEDIUM_MAXFEEPERGAS_BN_WEI.toString(16); // 10 GWEI in hex WEI
const mockTransaction = {
  id: '1',
  chainId: '0x5',
  networkClientId: 'goerli',
  userFeeLevel: 'tenPercentIncreased',
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

  const render = (
    props: Partial<React.ComponentProps<typeof CancelSpeedup>> = {},
    maxFeePerGas = MOCK_SUGGESTED_MEDIUM_MAXFEEPERGAS_HEX_WEI,
  ) => {
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
        gasFeeEstimates:
          mockEstimates[GasEstimateTypes.feeMarket].gasFeeEstimates,
        gasFeeEstimatesByChainId: {
          ...mockState.metamask.gasFeeEstimatesByChainId,
          '0x5': {
            ...mockState.metamask.gasFeeEstimatesByChainId['0x5'],
            gasFeeEstimates:
              mockEstimates[GasEstimateTypes.feeMarket].gasFeeEstimates,
          },
        },
      },
    });

    return renderWithProvider(
      <CancelSpeedup
        transaction={
          {
            ...mockTransaction,
            txParams: {
              ...mockTransaction.txParams,
              maxFeePerGas,
            },
          } as TransactionMeta
        }
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
      expect(screen.getByText('Speed up transaction')).toBeInTheDocument();
    });

    expect(
      screen.getByText('This network fee will replace the original.'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('cancel-speedup-confirm-button'),
    ).toBeInTheDocument();
    expect(screen.getByText('Network fee')).toBeInTheDocument();
    expect(screen.getByText('Speed')).toBeInTheDocument();
    expect(screen.getByTestId('gas-timing-time')).toBeInTheDocument();
  });

  it('renders correctly in Cancel mode', async () => {
    render({ editGasMode: EditGasModes.cancel });

    await waitFor(() => {
      expect(screen.getByText('Cancel transaction')).toBeInTheDocument();
    });

    expect(
      screen.getByText(
        'This transaction will be canceled and this network fee will replace the original.',
      ),
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
      expect(mockOpenModal).toHaveBeenCalledWith('editGasFee');
    });
  });

  it('shows correct gas values, increased by 10%, when initial initial gas value is above estimated medium', async () => {
    render(
      {
        editGasMode: EditGasModes.speedUp,
      },
      MAXFEEPERGAS_ABOVE_MOCK_MEDIUM_HEX,
    );

    await waitFor(() => {
      expect(screen.getByTestId('edit-gas-fees-row')).toHaveTextContent(
        EXPECTED_ETH_FEE_1,
      );
      expect(screen.getByTestId('edit-gas-fees-row')).toHaveTextContent('ETH');
    });
  });

  it('shows correct gas values, set to the estimated medium, when initial initial gas value is below estimated medium', async () => {
    render(
      {
        editGasMode: EditGasModes.speedUp,
      },
      `0x${MAXFEEPERGAS_BELOW_MOCK_MEDIUM_HEX}`,
    );

    await waitFor(() => {
      expect(screen.getByTestId('edit-gas-fees-row')).toHaveTextContent(
        EXPECTED_ETH_FEE_2,
      );
      expect(screen.getByTestId('edit-gas-fees-row')).toHaveTextContent('ETH');
    });
  });
});
