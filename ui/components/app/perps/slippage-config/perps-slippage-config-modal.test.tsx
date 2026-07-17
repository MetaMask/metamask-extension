import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../../store/store';
import mockState from '../../../../../test/data/mock-state.json';
import { PerpsSlippageConfigModal } from './perps-slippage-config-modal';

const mockStore = configureStore({
  metamask: {
    ...mockState.metamask,
  },
});

// 100 bps (1%) is not a quick-pick preset, so the modal opens in custom mode
// with the numeric input visible.
const CUSTOM_VALUE_BPS = 100;

const renderModal = (onSave = jest.fn()) => {
  renderWithProvider(
    <PerpsSlippageConfigModal
      isOpen
      currentValueBps={CUSTOM_VALUE_BPS}
      onClose={jest.fn()}
      onSave={onSave}
    />,
    mockStore,
  );
  return onSave;
};

describe('PerpsSlippageConfigModal custom value validation', () => {
  const typeDraft = (value: string) => {
    fireEvent.change(screen.getByTestId('perps-slippage-config-custom-input'), {
      target: { value },
    });
  };

  const invalidValues = ['1abc', '1.2.3', '12x'];
  invalidValues.forEach((value) => {
    it(`rejects partial/invalid string "${value}"`, () => {
      renderModal();
      typeDraft(value);

      expect(screen.getByTestId('perps-slippage-config-set')).toBeDisabled();
      expect(
        screen.getByTestId('perps-slippage-config-custom-error'),
      ).toBeInTheDocument();
    });
  });

  it('does not save an invalid value when Set is pressed', () => {
    const onSave = renderModal();
    typeDraft('1abc');

    fireEvent.click(screen.getByTestId('perps-slippage-config-set'));

    expect(onSave).not.toHaveBeenCalled();
  });

  it('accepts and saves a valid in-range value', () => {
    const onSave = renderModal();
    typeDraft('2');

    const setButton = screen.getByTestId('perps-slippage-config-set');
    expect(setButton).not.toBeDisabled();

    fireEvent.click(setButton);
    expect(onSave).toHaveBeenCalledWith(200);
  });

  it('keeps the modal open when onSave rejects', async () => {
    const onClose = jest.fn();
    const onSave = jest.fn().mockRejectedValue(new Error('persist failed'));

    renderWithProvider(
      <PerpsSlippageConfigModal
        isOpen
        currentValueBps={CUSTOM_VALUE_BPS}
        onClose={onClose}
        onSave={onSave}
      />,
      mockStore,
    );

    fireEvent.change(screen.getByTestId('perps-slippage-config-custom-input'), {
      target: { value: '2' },
    });
    fireEvent.click(screen.getByTestId('perps-slippage-config-set'));

    await screen.findByTestId('perps-slippage-config-modal');
    expect(onSave).toHaveBeenCalledWith(200);
    expect(onClose).not.toHaveBeenCalled();
  });
});
