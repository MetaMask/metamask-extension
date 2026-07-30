import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react';
import {
  CHAIN_IDS,
  type TransactionMeta,
} from '@metamask/transaction-controller';
import configureStore from '../../../../../store/store';
import { renderWithConfirmContextProvider } from '../../../../../../test/lib/confirmations/render-helpers';
import { getMockConfirmStateForTransaction } from '../../../../../../test/data/confirmations/helper';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../../test/data/confirmations/contract-interaction';
import { GasModalType } from '../../../constants/gas';
import { enLocale as messages } from '../../../../../../test/lib/i18n-helpers';
import { AdvancedEIP1559Modal } from './advanced-eip1559-modal';

const mockPersistGasFeePreference = jest.fn();

jest.mock('../../max-base-fee-input/max-base-fee-input', () => ({
  MaxBaseFeeInput: () => (
    <div data-testid="max-base-fee-input">Max Base Fee Input</div>
  ),
}));

jest.mock('../../priority-fee-input/priority-fee-input', () => ({
  PriorityFeeInput: () => (
    <div data-testid="priority-fee-input">Priority Fee Input</div>
  ),
}));

jest.mock('../../gas-input/gas-input', () => ({
  GasInput: () => <div data-testid="gas-input">Gas Input</div>,
}));

jest.mock('../../../hooks/gas/usePersistGasFeePreference', () => ({
  usePersistGasFeePreference: () => mockPersistGasFeePreference,
}));

jest.mock('../../../../../store/actions/update-transaction-gas-fees', () => ({
  updateTransactionGasFees: jest.fn(() => ({ type: 'update-gas-fees' })),
}));

const render = () => {
  const contractInteraction = genUnapprovedContractInteractionConfirmation({
    chainId: CHAIN_IDS.GOERLI,
  }) as TransactionMeta;
  contractInteraction.txParams.from =
    '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc';
  contractInteraction.txParams.maxFeePerGas = '0x3b9aca00';
  contractInteraction.txParams.maxPriorityFeePerGas = '0x59682f00';

  const store = configureStore(
    getMockConfirmStateForTransaction(contractInteraction),
  );

  const mockSetActiveModal = jest.fn();
  const mockHandleCloseModals = jest.fn();

  const result = renderWithConfirmContextProvider(
    <AdvancedEIP1559Modal
      setActiveModal={mockSetActiveModal}
      handleCloseModals={mockHandleCloseModals}
    />,
    store,
  );

  return {
    ...result,
    contractInteraction,
    mockSetActiveModal,
    mockHandleCloseModals,
  };
};

describe('AdvancedEIP1559Modal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the modal with header', () => {
    const { getByText } = render();
    expect(
      getByText(messages.advancedEIP1559ModalTitle.message),
    ).toBeInTheDocument();
  });

  it('renders all gas input components', () => {
    const { getByTestId } = render();

    expect(getByTestId('max-base-fee-input')).toBeInTheDocument();
    expect(getByTestId('priority-fee-input')).toBeInTheDocument();
    expect(getByTestId('gas-input')).toBeInTheDocument();
  });

  it('renders Cancel and Save buttons', () => {
    const { getByText } = render();

    expect(getByText(messages.cancel.message)).toBeInTheDocument();
    expect(getByText(messages.save.message)).toBeInTheDocument();
  });

  it('navigates to EstimatesModal when Cancel is clicked', () => {
    const { getByText, mockSetActiveModal } = render();

    fireEvent.click(getByText(messages.cancel.message));

    expect(mockSetActiveModal).toHaveBeenCalledWith(
      GasModalType.EstimatesModal,
    );
  });

  it('persists custom EIP-1559 gas fee preferences when Save is clicked', async () => {
    const { contractInteraction, getByText, mockHandleCloseModals } = render();

    fireEvent.click(getByText(messages.save.message));

    await waitFor(() => {
      expect(mockPersistGasFeePreference).toHaveBeenCalledWith(
        contractInteraction,
        {
          userFeeLevel: 'custom',
          maxBaseFee: '1',
          priorityFee: '1.5',
        },
      );
    });
    expect(mockHandleCloseModals).toHaveBeenCalledTimes(1);
  });
});
