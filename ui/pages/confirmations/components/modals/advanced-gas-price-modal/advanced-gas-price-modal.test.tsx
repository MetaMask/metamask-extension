import React from 'react';
import { fireEvent } from '@testing-library/react';
import { CHAIN_IDS } from '@metamask/transaction-controller';
import configureStore from '../../../../../store/store';
import { renderWithConfirmContextProvider } from '../../../../../../test/lib/confirmations/render-helpers';
import { getMockConfirmStateForTransaction } from '../../../../../../test/data/confirmations/helper';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../../test/data/confirmations/contract-interaction';
import { GasModalType } from '../../../constants/gas';
import { AdvancedGasPriceModal } from './advanced-gas-price-modal';

jest.mock('../../gas-price-input/gas-price-input', () => ({
  GasPriceInput: () => <div data-testid="gas-price-input">Gas Price Input</div>,
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
    <AdvancedGasPriceModal
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

describe('AdvancedGasPriceModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the modal with header', () => {
    const { getByText } = render();

    expect(getByText('Advanced Network Fee')).toBeInTheDocument();
  });

  it('renders all gas input components', () => {
    const { getByTestId } = render();

    expect(getByTestId('gas-price-input')).toBeInTheDocument();
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
