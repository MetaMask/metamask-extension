import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../../store/store';
import mockState from '../../../../../test/data/mock-state.json';
import { SlippageConfigModal } from './slippage-config-modal';

const mockStore = configureStore({
  metamask: { ...mockState.metamask },
});

function render(
  props: Partial<React.ComponentProps<typeof SlippageConfigModal>> = {},
) {
  const onSave = jest.fn();
  const onClose = jest.fn();
  renderWithProvider(
    <SlippageConfigModal
      isOpen
      currentValuePct={3}
      onSave={onSave}
      onClose={onClose}
      {...props}
    />,
    mockStore,
  );
  return { onSave, onClose, user: userEvent.setup() };
}

async function setInputValue(
  user: ReturnType<typeof userEvent.setup>,
  value: string,
) {
  const input = screen.getByTestId(
    'perps-slippage-config-input',
  ) as HTMLInputElement;
  await user.clear(input);
  await user.type(input, value);
}

describe('SlippageConfigModal', () => {
  it('renders with the current max-slippage value pre-selected in the input', () => {
    render({ currentValuePct: 3 });
    const input = screen.getByTestId(
      'perps-slippage-config-input',
    ) as HTMLInputElement;
    expect(input.value).toBe('3');
  });

  it('saves the chosen value, snapping it to the 0.1% step, and closes', async () => {
    const { onSave, onClose, user } = render({ currentValuePct: 3 });
    await setInputValue(user, '1.23');
    await user.click(screen.getByTestId('perps-slippage-config-save'));
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave.mock.calls[0][0]).toBeCloseTo(1.2, 5);
    expect(onClose).toHaveBeenCalled();
  });

  it('disables save and shows an error when the value is out of the allowed range', async () => {
    const { user } = render();
    await setInputValue(user, '50');
    expect(screen.getByTestId('perps-slippage-config-save')).toBeDisabled();
    expect(
      screen.getByTestId('perps-slippage-config-error'),
    ).toBeInTheDocument();
  });

  it('applies a preset and triggers save with the preset value', async () => {
    const { onSave, user } = render({ currentValuePct: 3 });
    await user.click(screen.getByTestId('perps-slippage-config-preset-5'));
    await user.click(screen.getByTestId('perps-slippage-config-save'));
    expect(onSave).toHaveBeenCalledWith(5);
  });

  it('does nothing when save is clicked with an invalid value', async () => {
    const { onSave, onClose, user } = render();
    await setInputValue(user, '0.05');
    await user.click(screen.getByTestId('perps-slippage-config-save'));
    expect(onSave).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });
});
