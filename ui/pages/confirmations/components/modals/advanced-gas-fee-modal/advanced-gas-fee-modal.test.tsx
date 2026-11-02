import React from 'react';
import { fireEvent } from '@testing-library/react';

import { renderWithProvider } from '../../../../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../../../../test/lib/i18n-helpers';
import { AdvancedGasFeeModal } from './advanced-gas-fee-modal';

const render = ({
  isGasEstimationFailed = false,
  isGasLimitAvailable = true,
  isGasLimitEditable = true,
}: {
  isGasEstimationFailed?: boolean;
  isGasLimitAvailable?: boolean;
  isGasLimitEditable?: boolean;
} = {}) => {
  const handleCloseModals = jest.fn();
  const onGasLimitChange = jest.fn();
  const onGasLimitErrorChange = jest.fn();
  const onNavigateToEstimates = jest.fn();
  const onSave = jest.fn();
  const result = renderWithProvider(
    <AdvancedGasFeeModal
      gasLimit="0x5208"
      handleCloseModals={handleCloseModals}
      hasError={false}
      isGasEstimationFailed={isGasEstimationFailed}
      isGasLimitAvailable={isGasLimitAvailable}
      isGasLimitEditable={isGasLimitEditable}
      modalTestId="advanced-gas-fee-modal"
      onGasLimitChange={onGasLimitChange}
      onGasLimitErrorChange={onGasLimitErrorChange}
      onNavigateToEstimates={onNavigateToEstimates}
      onSave={onSave}
      title="Advanced gas fees"
    >
      <div>Fee inputs</div>
    </AdvancedGasFeeModal>,
  );

  return {
    ...result,
    onNavigateToEstimates,
    onSave,
  };
};

describe('AdvancedGasFeeModal', () => {
  it('renders fee inputs, the gas limit, and modal actions', () => {
    const { getByText, getByTestId } = render();

    expect(getByText('Advanced gas fees')).toBeInTheDocument();
    expect(getByText('Fee inputs')).toBeInTheDocument();
    expect(getByTestId('gas-input').querySelector('input')).toHaveValue(
      '21000',
    );
    expect(getByText(messages.cancel.message)).toBeInTheDocument();
    expect(getByText(messages.save.message)).toBeInTheDocument();
  });

  it('explains an estimation failure and disables Save', () => {
    const { getByText, getByTestId } = render({
      isGasEstimationFailed: true,
      isGasLimitAvailable: false,
    });

    const helpText = getByText(messages.alertMessageGasEstimateFailed.message);
    expect(getByTestId('gas-fee-modal-save-button')).toBeDisabled();
    expect(getByTestId('gas-fee-modal-save-button')).toHaveAttribute(
      'aria-describedby',
      helpText.id,
    );
  });

  it('handles modal actions', () => {
    const { getByText, onNavigateToEstimates, onSave } = render();

    fireEvent.click(getByText(messages.cancel.message));
    fireEvent.click(getByText(messages.save.message));

    expect(onNavigateToEstimates).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledTimes(1);
  });
});
