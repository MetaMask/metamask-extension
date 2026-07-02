import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { HardwareHdPathOption } from './hardware-hd-path-option';
import type { HardwareHdPathOptionProps } from './hardware-hd-path-option.types';

const defaultProps: HardwareHdPathOptionProps = {
  label: 'Ledger Live',
  isSelected: false,
  onSelect: jest.fn(),
};

const renderOption = (props: Partial<HardwareHdPathOptionProps> = {}) => {
  const mergedProps: HardwareHdPathOptionProps = {
    ...defaultProps,
    ...props,
  };

  return {
    props: mergedProps,
    ...render(<HardwareHdPathOption {...mergedProps} />),
  };
};

describe('HardwareHdPathOption', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders the label', () => {
      renderOption({ label: 'Ledger BIP44' });

      expect(screen.getByText('Ledger BIP44')).toBeInTheDocument();
    });

    it('renders a checked checkbox when selected', () => {
      renderOption({ isSelected: true });

      expect(
        screen.getByRole('checkbox', { name: 'Ledger Live' }),
      ).toBeChecked();
      expect(screen.getByTestId('hardware-hd-path-option')).toHaveAttribute(
        'data-selected',
        'true',
      );
    });

    it('does not render a checkbox when not selected', () => {
      renderOption({ isSelected: false });

      expect(
        screen.queryByRole('checkbox', { name: 'Ledger Live' }),
      ).not.toBeInTheDocument();
      expect(screen.getByTestId('hardware-hd-path-option')).toHaveAttribute(
        'data-selected',
        'false',
      );
    });
  });

  describe('selection', () => {
    it('calls onSelect when the option is clicked', () => {
      const { props } = renderOption();

      fireEvent.click(screen.getByTestId('hardware-hd-path-option'));

      expect(props.onSelect).toHaveBeenCalledTimes(1);
    });
  });
});
