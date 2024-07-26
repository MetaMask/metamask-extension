// This file has been updated to address failing tests related to maskImage style and radio button selection
import React from 'react';

jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useRef: jest.fn(),
}));

import { renderWithProvider, fireEvent, screen, waitFor, within } from '../../../../test/jest';
import { act } from '@testing-library/react';
import { Slippage } from '../../../../shared/constants/swaps';
import SlippageButtons from './slippage-buttons';
import { prettyDOM } from '@testing-library/react';

const createProps = (customProps = {}) => {
  return {
    onSelect: jest.fn(),
    maxAllowedSlippage: 15,
    currentSlippage: Slippage.high,
    smartTransactionsEnabled: false,
    ...customProps,
  };
};

describe('SlippageButtons', () => {
  it('renders the component with initial props', () => {
    renderWithProvider(
      <SlippageButtons {...createProps()} />,
    );
    const button = screen.getByText('Advanced options').closest('button');
    expect(button).toHaveClass('mm-button-base', 'slippage-buttons__header');
    const iconSpan = button.querySelector('span.mm-icon');
    expect(iconSpan).toHaveClass('mm-icon--size-sm');
    expect(iconSpan).toHaveStyle({ 'mask-image': "url('./images/icons/arrow-up.svg')" });
    expect(screen.queryByText('Smart Swaps')).not.toBeInTheDocument();
  });

  it('renders slippage with a custom value', () => {
    renderWithProvider(
      <SlippageButtons {...createProps({ currentSlippage: 2.5 })} />,
    );
    const button = screen.getByText('Advanced options').closest('button');
    expect(button).toHaveClass('mm-button-base', 'slippage-buttons__header');
    const iconSpan = button.querySelector('span.mm-icon');
    expect(iconSpan).toHaveClass('mm-icon--size-sm');
    expect(iconSpan).toHaveStyle({ 'mask-image': "url('./images/icons/arrow-up.svg')" });
  });

  it('renders the default slippage with Advanced options hidden', () => {
    renderWithProvider(
      <SlippageButtons
        {...createProps({ currentSlippage: Slippage.default })}
      />,
    );
    const button = screen.getByText('Advanced options').closest('button');
    expect(button).toHaveClass('mm-button-base', 'slippage-buttons__header');
    const iconSpan = button.querySelector('span.mm-icon');
    expect(iconSpan).toHaveClass('mm-icon--size-sm');
    expect(iconSpan).toHaveStyle({ 'mask-image': "url('./images/icons/arrow-down.svg')" });
    expect(screen.queryByText('2%')).not.toBeInTheDocument();
  });

  it('opens the Advanced options section and displays slippage options', async () => {
    renderWithProvider(
      <SlippageButtons
        {...createProps({ currentSlippage: Slippage.default })}
      />,
    );
    const button = screen.getByText('Advanced options').closest('button');
    await act(async () => {
      fireEvent.click(button);
    });
    await waitFor(() => expect(screen.getByText('2%')).toBeInTheDocument());
    expect(screen.getByText('3%')).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /custom/i })).toBeInTheDocument();
    const iconSpan = button.querySelector('span.mm-icon');
    expect(iconSpan).toHaveAttribute('style', expect.stringContaining("mask-image: url('./images/icons/arrow-up.svg')"));
  });

  it('sets a default slippage when clicked', () => {
    renderWithProvider(
      <SlippageButtons
        {...createProps({ currentSlippage: Slippage.default })}
      />,
    );
    const advancedOptionsButton = screen.getByText('Advanced options').closest('button');
    fireEvent.click(advancedOptionsButton);
    const defaultSlippageButton = screen.getByRole('radio', { name: '2%' });
    fireEvent.click(defaultSlippageButton);
    expect(defaultSlippageButton).toHaveClass('button-group__button--active', 'radio-button--active');
  });

  it('sets a high slippage when clicked', () => {
    renderWithProvider(
      <SlippageButtons
        {...createProps({ currentSlippage: Slippage.default })}
      />,
    );
    const advancedOptionsButton = screen.getByText('Advanced options').closest('button');
    fireEvent.click(advancedOptionsButton);
    const highSlippageButton = screen.getByRole('radio', { name: '3%' });
    fireEvent.click(highSlippageButton);
    expect(highSlippageButton).toHaveClass('button-group__button--active', 'radio-button--active');
  });

  it('sets a custom slippage value', async () => {
    const { getByText, getByRole } = renderWithProvider(
      <SlippageButtons
        onSelect={jest.fn()}
        maxAllowedSlippage={15}
        currentSlippage={2}
      />,
    );

    // Open advanced options
    const advancedOptionsButton = getByText('Advanced options');
    fireEvent.click(advancedOptionsButton);

    await waitFor(() => {
      expect(getByText('2%')).toBeInTheDocument();
    });

    const customButton = getByRole('radio', { name: /custom/i });
    fireEvent.click(customButton);

    const input = getByRole('textbox');
    fireEvent.change(input, { target: { value: '5' } });

    expect(input).toHaveValue('5');
  });

  it('toggles the advanced options and changes the icon', async () => {
    renderWithProvider(
      <SlippageButtons
        {...createProps({ currentSlippage: Slippage.default })}
      />,
    );
    const button = screen.getByText('Advanced options').closest('button');

    // Check initial state (closed)
    let iconSpan = button.querySelector('span.mm-icon');
    expect(iconSpan).toHaveClass('mm-icon--size-sm');
    expect(iconSpan).toHaveAttribute('style', expect.stringContaining("mask-image: url('./images/icons/arrow-down.svg')"));

    // Open advanced options
    await act(async () => {
      fireEvent.click(button);
    });

    // Check open state
    await waitFor(() => {
      expect(screen.getByText('2%')).toBeInTheDocument();
      expect(screen.getByText('3%')).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: /custom/i })).toBeInTheDocument();
    });

    await waitFor(() => {
      iconSpan = button.querySelector('span.mm-icon');
      expect(iconSpan).toHaveAttribute('style', expect.stringContaining("mask-image: url('./images/icons/arrow-up.svg')"));
    });

    // Close advanced options
    await act(async () => {
      fireEvent.click(button);
    });

    // Check closed state again
    await waitFor(() => {
      iconSpan = button.querySelector('span.mm-icon');
      expect(iconSpan).toHaveClass('mm-icon--size-sm');
      expect(iconSpan).toHaveAttribute('style', expect.stringContaining("mask-image: url('./images/icons/arrow-down.svg')"));
    });
  });
});

afterAll(() => {
  jest.restoreAllMocks();
});
