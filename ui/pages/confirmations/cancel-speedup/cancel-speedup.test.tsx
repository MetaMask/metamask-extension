import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { EditGasModes, PriorityLevels } from '../../../../shared/constants/gas';
import { CancelSpeedup } from './cancel-speedup';
import { useTransactionModalContext } from '../../../contexts/transaction-modal';
import { useGasFeeContext } from '../../../contexts/gasFee';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { gasEstimateGreaterThanGasUsedPlusTenPercent } from '../../../helpers/utils/gas';
import { useCurrencyDisplay } from '../../../hooks/useCurrencyDisplay';
import { useUserPreferencedCurrency } from '../../../hooks/useUserPreferencedCurrency';
import { TransactionMeta } from '@metamask/transaction-controller';
import configureStore from '../../../store/store';

jest.mock('../../../contexts/transaction-modal', () => ({
  useTransactionModalContext: jest.fn(),
}));

jest.mock('../../../contexts/gasFee', () => ({
  useGasFeeContext: jest.fn(),
  GasFeeContextProvider: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

jest.mock('../../../helpers/utils/gas', () => ({
  gasEstimateGreaterThanGasUsedPlusTenPercent: jest.fn(),
}));

jest.mock('../../../hooks/useCurrencyDisplay', () => ({
  useCurrencyDisplay: jest.fn(),
}));

jest.mock('../../../hooks/useUserPreferencedCurrency', () => ({
  useUserPreferencedCurrency: jest.fn(),
}));

jest.mock('../components/gas-timing/gas-timing.component', () => ({
  __esModule: true,
  default: () => <div data-testid="gas-timing">Gas Timing</div>,
}));

const mockTransaction = {
  id: '1',
  chainId: '0x1',
  txParams: {
    from: '0x123',
    to: '0x456',
    gas: '0x5208',
  },
  previousGas: null,
} as unknown as TransactionMeta;

const defaultGasFeeContext = {
  transaction: mockTransaction,
  maxFeePerGas: '0x3b9aca00',
  maxPriorityFeePerGas: '0x3b9aca00',
  minimumCostInHexWei: '0x2386f26fc10000',
  cancelTransaction: jest.fn(),
  speedUpTransaction: jest.fn(),
  updateTransactionToTenPercentIncreasedGasFee: jest.fn(),
  updateTransactionUsingEstimate: jest.fn(),
  updateTransaction: jest.fn(),
  gasFeeEstimates: { medium: { suggestedMaxFeePerGas: '10' } },
  editGasMode: EditGasModes.speedUp,
};

describe('CancelSpeedup Component', () => {
  const mockCloseModal = jest.fn();
  const mockOpenModal = jest.fn();
  let store: any;

  beforeEach(() => {
    jest.clearAllMocks();

    (useTransactionModalContext as jest.Mock).mockReturnValue({
      currentModal: 'cancelSpeedUpTransaction',
      closeModal: mockCloseModal,
      openModal: mockOpenModal,
    });

    (useGasFeeContext as jest.Mock).mockReturnValue({
      ...defaultGasFeeContext,
      cancelTransaction: jest.fn(),
      speedUpTransaction: jest.fn(),
      updateTransactionToTenPercentIncreasedGasFee: jest.fn(),
      updateTransactionUsingEstimate: jest.fn(),
    });

    (useCurrencyDisplay as jest.Mock).mockReturnValue(['0.001 ETH', '']);
    (useUserPreferencedCurrency as jest.Mock).mockReturnValue({
      currency: 'ETH',
      numberOfDecimals: 6,
    });

    (gasEstimateGreaterThanGasUsedPlusTenPercent as jest.Mock).mockReturnValue(
      false,
    );

    store = configureStore({
      appState: {
        isLoading: false,
      },
      metamask: {
        preferences: {
          showFiatInTestnets: true,
        },
      },
    });
  });

  it('renders nothing if currentModal is not cancelSpeedUpTransaction', () => {
    (useTransactionModalContext as jest.Mock).mockReturnValue({
      currentModal: 'none',
    });

    const { container } = renderWithProvider(
      <CancelSpeedup
        transaction={mockTransaction}
        editGasMode={EditGasModes.speedUp}
      />,
      store,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders correctly in Speed Up mode', () => {
    renderWithProvider(
      <CancelSpeedup
        transaction={mockTransaction}
        editGasMode={EditGasModes.speedUp}
      />,
      store,
    );

    expect(screen.getByText('Speed up transaction')).toBeInTheDocument();
    expect(
      screen.getByText('This network fee will replace the original.'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('cancel-speedup-confirm-button'),
    ).toBeInTheDocument();
    expect(screen.getByText('Network fee')).toBeInTheDocument();
    expect(screen.getByText('Speed')).toBeInTheDocument();
    expect(screen.getByTestId('gas-timing')).toBeInTheDocument();
  });

  it('renders correctly in Cancel mode', () => {
    (useGasFeeContext as jest.Mock).mockReturnValue({
      ...defaultGasFeeContext,
      editGasMode: EditGasModes.cancel,
    });

    renderWithProvider(
      <CancelSpeedup
        transaction={mockTransaction}
        editGasMode={EditGasModes.cancel}
      />,
      store,
    );

    expect(screen.getByText('Cancel transaction')).toBeInTheDocument();
    expect(
      screen.getByText(
        'This transaction will be canceled and this network fee will replace the original.',
      ),
    ).toBeInTheDocument();
  });

  it('calls updateTransactionToTenPercentIncreasedGasFee on mount when estimates are low', () => {
    const mockUpdate = jest.fn();
    (useGasFeeContext as jest.Mock).mockReturnValue({
      ...defaultGasFeeContext,
      updateTransactionToTenPercentIncreasedGasFee: mockUpdate,
    });
    (gasEstimateGreaterThanGasUsedPlusTenPercent as jest.Mock).mockReturnValue(
      false,
    );

    renderWithProvider(
      <CancelSpeedup
        transaction={mockTransaction}
        editGasMode={EditGasModes.speedUp}
      />,
      store,
    );

    expect(mockUpdate).toHaveBeenCalledWith(true);
  });

  it('calls updateTransactionUsingEstimate on mount when estimates are sufficient', () => {
    const mockUpdateUsingEstimate = jest.fn();
    (useGasFeeContext as jest.Mock).mockReturnValue({
      ...defaultGasFeeContext,
      updateTransactionUsingEstimate: mockUpdateUsingEstimate,
    });
    (gasEstimateGreaterThanGasUsedPlusTenPercent as jest.Mock).mockReturnValue(
      true,
    );

    renderWithProvider(
      <CancelSpeedup
        transaction={mockTransaction}
        editGasMode={EditGasModes.speedUp}
      />,
      store,
    );

    expect(mockUpdateUsingEstimate).toHaveBeenCalledWith(PriorityLevels.medium);
  });

  it('does NOT update transaction if transaction has previousGas', () => {
    const mockUpdate = jest.fn();
    (useGasFeeContext as jest.Mock).mockReturnValue({
      ...defaultGasFeeContext,
      updateTransactionToTenPercentIncreasedGasFee: mockUpdate,
      transaction: { ...mockTransaction, previousGas: {} },
    });

    renderWithProvider(
      <CancelSpeedup
        transaction={{ ...mockTransaction, previousGas: {} } as any}
        editGasMode={EditGasModes.speedUp}
      />,
      store,
    );

    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('calls speedUpTransaction and closes modal when confirming speed up', () => {
    const mockSpeedUp = jest.fn();
    (useGasFeeContext as jest.Mock).mockReturnValue({
      ...defaultGasFeeContext,
      speedUpTransaction: mockSpeedUp,
    });

    renderWithProvider(
      <CancelSpeedup
        transaction={mockTransaction}
        editGasMode={EditGasModes.speedUp}
      />,
      store,
    );

    fireEvent.click(screen.getByTestId('cancel-speedup-confirm-button'));

    expect(mockSpeedUp).toHaveBeenCalledTimes(1);
    expect(mockCloseModal).toHaveBeenCalledWith(['cancelSpeedUpTransaction']);
  });

  it('calls cancelTransaction and closes modal when confirming cancel', () => {
    const mockCancel = jest.fn();
    (useGasFeeContext as jest.Mock).mockReturnValue({
      ...defaultGasFeeContext,
      cancelTransaction: mockCancel,
      editGasMode: EditGasModes.cancel,
    });

    renderWithProvider(
      <CancelSpeedup
        transaction={mockTransaction}
        editGasMode={EditGasModes.cancel}
      />,
      store,
    );

    fireEvent.click(screen.getByTestId('cancel-speedup-confirm-button'));

    expect(mockCancel).toHaveBeenCalledTimes(1);
    expect(mockCloseModal).toHaveBeenCalledWith(['cancelSpeedUpTransaction']);
  });

  it('opens the edit gas modal when the edit icon is clicked', () => {
    renderWithProvider(
      <CancelSpeedup
        transaction={mockTransaction}
        editGasMode={EditGasModes.speedUp}
      />,
      store,
    );

    fireEvent.click(screen.getByTestId('edit-gas-fee-icon'));
    expect(mockOpenModal).toHaveBeenCalledWith('editGasFee');
  });

  it('displays correct fee values from useCurrencyDisplay', () => {
    (useCurrencyDisplay as jest.Mock)
      .mockReturnValueOnce(['0.05 ETH', 'ETH']) // native fee
      .mockReturnValueOnce(['$100.00', 'USD']); // fiat fee

    renderWithProvider(
      <CancelSpeedup
        transaction={mockTransaction}
        editGasMode={EditGasModes.speedUp}
      />,
      store,
    );

    expect(screen.getByText('0.05 ETH')).toBeInTheDocument();
    expect(screen.getByText('$100.00')).toBeInTheDocument();
  });
});
