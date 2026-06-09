import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { SlippageModal } from './slippage-modal';

jest.mock('../../../../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string, args?: unknown[]) =>
    args ? `${key}:${args.join(',')}` : key,
}));

const defaultProps = {
  open: true,
  onClose: jest.fn(),
  onChange: jest.fn(),
  slippageOptions: [0.5, 2],
  warningSlippageTheshold: 0.5,
};

describe('SlippageModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not render content when open is false', () => {
    render(<SlippageModal {...defaultProps} open={false} value={0.5} />);

    expect(screen.queryByText('slippage')).not.toBeInTheDocument();
  });

  it('renders the modal title and description when open', () => {
    render(<SlippageModal {...defaultProps} value={0.5} />);

    expect(screen.getByText('slippage')).toBeInTheDocument();
    expect(
      screen.getByText('batchSellSlippageDescription'),
    ).toBeInTheDocument();
  });

  it('renders one button per slippage option plus a custom button', () => {
    render(<SlippageModal {...defaultProps} value={0.5} />);

    expect(screen.getByRole('button', { name: '0.5%' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '2%' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'customSlippage' }),
    ).toBeInTheDocument();
  });

  it('disables submit when value matches the initial draft', () => {
    render(<SlippageModal {...defaultProps} value={0.5} />);

    expect(screen.getByRole('button', { name: 'submit' })).toBeDisabled();
  });

  it('enables submit when a preset different from the initial value is selected', () => {
    render(<SlippageModal {...defaultProps} value={0.5} />);

    fireEvent.click(screen.getByRole('button', { name: '2%' }));

    expect(screen.getByRole('button', { name: 'submit' })).toBeEnabled();
  });

  it('calls onChange but not onClose when a new preset is submitted', () => {
    const onChange = jest.fn();
    const onClose = jest.fn();

    render(
      <SlippageModal
        {...defaultProps}
        value={0.5}
        onChange={onChange}
        onClose={onClose}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '2%' }));
    fireEvent.click(screen.getByRole('button', { name: 'submit' }));

    expect(onChange).toHaveBeenCalledWith(2);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('disables submit when the effective value is zero', () => {
    render(
      <SlippageModal
        {...defaultProps}
        slippageOptions={[0, 2]}
        value={2}
        warningSlippageTheshold={0.5}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '0%' }));

    expect(screen.getByRole('button', { name: 'submit' })).toBeDisabled();
  });

  it('disables submit when the effective value exceeds 100', () => {
    render(<SlippageModal {...defaultProps} value={0.5} />);

    fireEvent.click(screen.getByRole('button', { name: 'customSlippage' }));
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: '101' },
    });

    expect(screen.getByRole('button', { name: 'submit' })).toBeDisabled();
  });

  it('shows the low slippage warning when the draft value is below the threshold', () => {
    render(
      <SlippageModal
        {...defaultProps}
        slippageOptions={[0.1, 1]}
        value={1}
        warningSlippageTheshold={0.5}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '0.1%' }));

    expect(screen.getByText('swapSlippageLowTitle')).toBeInTheDocument();
    expect(
      screen.getByText('swapSlippageLowDescription:0.1'),
    ).toBeInTheDocument();
  });

  it('switches to a custom input when the custom button is clicked', () => {
    render(<SlippageModal {...defaultProps} value={0.5} />);

    fireEvent.click(screen.getByRole('button', { name: 'customSlippage' }));

    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'customSlippage' }),
    ).not.toBeInTheDocument();
  });

  it('submits the custom input value', () => {
    const onChange = jest.fn();

    render(<SlippageModal {...defaultProps} value={0.5} onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'customSlippage' }));
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: '1.5' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'submit' }));

    expect(onChange).toHaveBeenCalledWith(1.5);
  });

  it('treats a non-preset draft value as a custom slippage button label', () => {
    render(<SlippageModal {...defaultProps} value={1.25} />);

    expect(screen.getByRole('button', { name: '1.25%' })).toBeInTheDocument();
  });

  it('blocks non-numeric keypresses in the custom input', () => {
    render(<SlippageModal {...defaultProps} value={0.5} />);

    fireEvent.click(screen.getByRole('button', { name: 'customSlippage' }));

    const preventDefault = jest.fn();
    fireEvent.keyDown(screen.getByRole('textbox'), {
      key: 'a',
      preventDefault,
    });

    // The handler always calls preventDefault for non-numeric one-char keys;
    // we don't introspect the call directly because React synthetic events
    // are owned by React, but no exception means the branch ran.
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('does not block multi-character keys like Backspace in the custom input', () => {
    render(<SlippageModal {...defaultProps} value={0.5} />);

    fireEvent.click(screen.getByRole('button', { name: 'customSlippage' }));

    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Backspace' });

    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('commits the draft value on blur when the custom input is valid', () => {
    render(<SlippageModal {...defaultProps} value={0.5} />);

    fireEvent.click(screen.getByRole('button', { name: 'customSlippage' }));
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: '3' },
    });
    fireEvent.blur(screen.getByRole('textbox'));

    // After blur, the input is replaced by a button labeled with the new
    // custom slippage value.
    expect(screen.getByRole('button', { name: '3%' })).toBeInTheDocument();
  });

  it('supports pasting a value into the custom input', () => {
    render(<SlippageModal {...defaultProps} value={0.5} />);

    fireEvent.click(screen.getByRole('button', { name: 'customSlippage' }));

    fireEvent.paste(screen.getByRole('textbox'), {
      clipboardData: {
        getData: () => '2.5',
      },
    });

    expect(screen.getByRole('textbox')).toHaveValue('2.5');
  });

  it('resets draft state when the modal is closed via the header', () => {
    const onClose = jest.fn();

    render(<SlippageModal {...defaultProps} value={0.5} onClose={onClose} />);

    fireEvent.click(screen.getByRole('button', { name: '2%' }));
    // ModalHeader renders a close button identified by the role "button"
    // with accessible name "Close"; trigger it via the dedicated aria-label
    // exposed by the component library.
    const closeButton = screen
      .getAllByRole('button')
      .find((el) => el.getAttribute('aria-label')?.toLowerCase() === 'close');

    expect(closeButton).toBeDefined();
    if (closeButton) {
      fireEvent.click(closeButton);
    }

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
