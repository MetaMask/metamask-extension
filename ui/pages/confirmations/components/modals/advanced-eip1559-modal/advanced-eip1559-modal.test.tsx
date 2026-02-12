import React from 'react';
import { fireEvent } from '@testing-library/react';
import { CHAIN_IDS } from '@metamask/transaction-controller';
import configureStore from '../../../../../store/store';
import { renderWithConfirmContextProvider } from '../../../../../../test/lib/confirmations/render-helpers';
import { getMockConfirmStateForTransaction } from '../../../../../../test/data/confirmations/helper';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../../test/data/confirmations/contract-interaction';
import { GasModalType } from '../../../constants/gas';
import { AdvancedEIP1559Modal } from './advanced-eip1559-modal';

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

const render = () => {
  const contractInteraction = genUnapprovedContractInteractionConfirmation({
    chainId: CHAIN_IDS.GOERLI,
  });

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
    expect(getByText('Advanced network fee')).toBeInTheDocument();
  });

  it('renders all gas input components', () => {
    const { getByTestId } = render();

    expect(getByTestId('max-base-fee-input')).toBeInTheDocument();
    expect(getByTestId('priority-fee-input')).toBeInTheDocument();
    expect(getByTestId('gas-input')).toBeInTheDocument();
  });

  it('renders Cancel and Save buttons', () => {
    const { getByText } = render();

    expect(getByText('Cancel')).toBeInTheDocument();
    expect(getByText('Save')).toBeInTheDocument();
  });

  it('navigates to EstimatesModal when Cancel is clicked', () => {
    const { getByText, mockSetActiveModal } = render();

    fireEvent.click(getByText('Cancel'));

    expect(mockSetActiveModal).toHaveBeenCalledWith(
      GasModalType.EstimatesModal,
    );
  });
});
