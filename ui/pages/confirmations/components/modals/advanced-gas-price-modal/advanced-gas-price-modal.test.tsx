import React from 'react';
import { act, fireEvent, waitFor } from '@testing-library/react';
import {
  CHAIN_IDS,
  type SimulationError,
  type TransactionMeta,
} from '@metamask/transaction-controller';
import { Hex } from '@metamask/utils';
import configureStore from '../../../../../store/store';
import { renderWithConfirmContextProvider } from '../../../../../../test/lib/confirmations/render-helpers';
import { getMockConfirmStateForTransaction } from '../../../../../../test/data/confirmations/helper';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../../test/data/confirmations/contract-interaction';
import { GasModalType } from '../../../constants/gas';
import { enLocale as messages } from '../../../../../../test/lib/i18n-helpers';
import { updateTransactionGasFees } from '../../../../../store/actions/update-transaction-gas-fees';
import { AdvancedGasPriceModal } from './advanced-gas-price-modal';

const mockPersistGasFeePreference = jest.fn();

jest.mock('../../gas-price-input/gas-price-input', () => ({
  GasPriceInput: ({ onChange }: { onChange: (value: Hex) => void }) => (
    <button
      data-testid="gas-price-input"
      onClick={() => onChange('0x77359400')}
    >
      Gas Price Input
    </button>
  ),
}));

jest.mock('../../gas-input/gas-input', () => ({
  GAS_INPUT_HELP_TEXT_ID: 'gas-input-help-text',
  GasInput: ({
    gasLimit,
    helpText,
    isDisabled,
    onChange,
  }: {
    gasLimit: Hex | undefined;
    helpText?: string;
    isDisabled?: boolean;
    onChange: (value: Hex) => void;
  }) => (
    <>
      <button
        data-is-disabled={isDisabled}
        data-testid="gas-input"
        disabled={isDisabled}
        onClick={() => onChange('0x9c40')}
      >
        {gasLimit}
      </button>
      {helpText && (
        <div id="gas-input-help-text" data-testid="gas-input-help-text">
          {helpText}
        </div>
      )}
    </>
  ),
}));

jest.mock('../../../hooks/gas/usePersistGasFeePreference', () => ({
  usePersistGasFeePreference: () => mockPersistGasFeePreference,
}));

jest.mock('../../../../../store/actions/update-transaction-gas-fees', () => ({
  updateTransactionGasFees: jest.fn(() => ({ type: 'update-gas-fees' })),
}));

const render = (
  {
    gasLimit,
    simulationFails,
  }: {
    gasLimit?: Hex;
    simulationFails?: SimulationError;
  } = { gasLimit: '0x7530' },
) => {
  const contractInteraction = genUnapprovedContractInteractionConfirmation({
    chainId: CHAIN_IDS.GOERLI,
    simulationFails,
  }) as TransactionMeta;
  contractInteraction.txParams.from =
    '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc';
  if (gasLimit) {
    contractInteraction.txParams.gas = gasLimit;
  } else {
    delete contractInteraction.txParams.gas;
  }
  contractInteraction.txParams.gasPrice = '0x2540be400';

  const store = configureStore(
    getMockConfirmStateForTransaction(contractInteraction),
  );

  const mockSetActiveModal = jest.fn();
  const mockHandleCloseModals = jest.fn();

  const result = renderWithConfirmContextProvider(
    <AdvancedGasPriceModal
      setActiveModal={mockSetActiveModal}
      handleCloseModals={mockHandleCloseModals}
    />,
    store,
  );

  return {
    ...result,
    contractInteraction,
    store,
    mockSetActiveModal,
    mockHandleCloseModals,
  };
};

describe('AdvancedGasPriceModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the modal with header', () => {
    const { getByText } = render();

    expect(
      getByText(messages.advancedGasPriceModalTitle.message),
    ).toBeInTheDocument();
  });

  it('renders all gas input components', () => {
    const { getByTestId } = render();

    expect(getByTestId('gas-price-input')).toBeInTheDocument();
    expect(getByTestId('gas-input')).toBeInTheDocument();
  });

  it('renders Cancel and Save buttons', () => {
    const { getByText } = render();

    expect(getByText(messages.cancel.message)).toBeInTheDocument();
    expect(getByText(messages.save.message)).toBeInTheDocument();
  });

  it('displays the transaction gas estimate without a universal fallback', () => {
    const { getByTestId } = render({ gasLimit: '0x9c40' });

    expect(getByTestId('gas-input')).toHaveTextContent('0x9c40');
    expect(getByTestId('gas-input')).not.toHaveTextContent('0x5208');
  });

  it('disables Save when the gas estimate is missing', () => {
    const { getByTestId } = render({ gasLimit: undefined });

    expect(getByTestId('gas-input')).toBeEmptyDOMElement();
    expect(getByTestId('gas-fee-modal-save-button')).toBeDisabled();
  });

  it('disables gas limit editing and explains why it is unavailable', () => {
    const { getByTestId } = render({ gasLimit: undefined });

    expect(getByTestId('gas-input')).toHaveAttribute(
      'data-is-disabled',
      'true',
    );
    expect(getByTestId('gas-input-help-text')).toHaveTextContent(
      messages.gasLimitEditingUnavailable.message,
    );
  });

  it('describes disabled Save using the gas limit status text', () => {
    const { getByTestId } = render({ gasLimit: undefined });

    const helpText = getByTestId('gas-input-help-text');
    expect(getByTestId('gas-fee-modal-save-button')).toHaveAttribute(
      'aria-describedby',
      helpText.id,
    );
  });

  it('invalidates stale gas when the network client changes', async () => {
    const { contractInteraction, getByTestId, store } = render();
    const updatedTransaction = {
      ...contractInteraction,
      networkClientId: 'alternate-goerli-client',
    };

    act(() => {
      store.dispatch({
        type: 'UPDATE_METAMASK_STATE',
        value: { transactions: [updatedTransaction] },
      });
    });

    expect(getByTestId('gas-input')).toBeEmptyDOMElement();
    expect(getByTestId('gas-fee-modal-save-button')).toBeDisabled();

    act(() => {
      store.dispatch({
        type: 'UPDATE_METAMASK_STATE',
        value: {
          transactions: [
            {
              ...updatedTransaction,
              txParams: { ...updatedTransaction.txParams, gas: '0x9c40' },
            },
          ],
        },
      });
    });

    await waitFor(() =>
      expect(getByTestId('gas-input')).toHaveTextContent('0x9c40'),
    );
    expect(getByTestId('gas-fee-modal-save-button')).toBeEnabled();
  });

  it('allows manual gas limit recovery when estimation fails', async () => {
    const { contractInteraction, getByTestId, getByText } = render({
      gasLimit: '0x9c40',
      simulationFails: { message: 'execution reverted' },
    });

    expect(getByTestId('gas-input')).toBeEmptyDOMElement();
    expect(getByTestId('gas-input')).toBeEnabled();
    expect(getByTestId('gas-input-help-text')).toHaveTextContent(
      messages.alertMessageGasEstimateFailed.message,
    );
    expect(getByTestId('gas-fee-modal-save-button')).toBeDisabled();

    fireEvent.click(getByTestId('gas-input'));
    expect(getByTestId('gas-fee-modal-save-button')).toBeEnabled();
    fireEvent.click(getByText(messages.save.message));

    await waitFor(() =>
      expect(updateTransactionGasFees).toHaveBeenCalledWith(
        contractInteraction.id,
        {
          userFeeLevel: 'custom',
          gas: '0x9c40',
          gasPrice: '0x2540be400',
        },
      ),
    );
  });

  it('navigates to EstimatesModal when Cancel is clicked', () => {
    const { getByText, mockSetActiveModal } = render();

    fireEvent.click(getByText(messages.cancel.message));

    expect(mockSetActiveModal).toHaveBeenCalledWith(
      GasModalType.EstimatesModal,
    );
  });

  it('preserves an unsaved gas price when polled estimates update', async () => {
    const { contractInteraction, getByTestId, getByText, store } = render();

    fireEvent.click(getByTestId('gas-price-input'));
    act(() => {
      store.dispatch({
        type: 'UPDATE_METAMASK_STATE',
        value: {
          transactions: [
            {
              ...contractInteraction,
              txParams: {
                ...contractInteraction.txParams,
                gasPrice: '0xb2d05e00',
              },
            },
          ],
        },
      });
    });
    fireEvent.click(getByText(messages.save.message));

    await waitFor(() =>
      expect(updateTransactionGasFees).toHaveBeenCalledWith(
        contractInteraction.id,
        {
          userFeeLevel: 'custom',
          gas: '0x7530',
          gasPrice: '0x77359400',
        },
      ),
    );
  });

  it('persists custom gas price preferences when Save is clicked', async () => {
    const { contractInteraction, getByText, mockHandleCloseModals } = render();

    fireEvent.click(getByText(messages.save.message));

    await waitFor(() => {
      expect(mockPersistGasFeePreference).toHaveBeenCalledWith(
        contractInteraction,
        {
          userFeeLevel: 'custom',
          gasPrice: '10',
        },
      );
    });
    expect(updateTransactionGasFees).toHaveBeenCalledWith(
      contractInteraction.id,
      {
        userFeeLevel: 'custom',
        gas: '0x7530',
        gasPrice: '0x2540be400',
      },
    );
    expect(mockHandleCloseModals).toHaveBeenCalledTimes(1);
  });
});
