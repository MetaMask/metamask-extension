import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { MultichainPrivateKeyRow } from './multichain-private-key-row';

jest.mock('../../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string) => key,
}));

const CHAIN_ID = 'eip155:1';
const PRIVATE_KEY = 'private-key-mock';
const mockOnCopy = jest.fn();
const mockOnToggle = jest.fn();

const renderComponent = ({
  isCollapsible = true,
  isExpanded = true,
}: {
  isCollapsible?: boolean;
  isExpanded?: boolean;
} = {}) =>
  render(
    <MultichainPrivateKeyRow
      address="0x1234567890abcdef1234567890abcdef12345678"
      chainId={CHAIN_ID}
      isCollapsible={isCollapsible}
      isExpanded={isExpanded}
      networkName="Ethereum and EVMs"
      onCopy={mockOnCopy}
      onToggle={mockOnToggle}
      privateKey={PRIVATE_KEY}
    />,
  );

describe('MultichainPrivateKeyRow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders the network and shortened address', () => {
    renderComponent();

    expect(screen.getByText('Ethereum and EVMs')).toBeInTheDocument();
    expect(screen.getByText('0x12345...45678')).toBeInTheDocument();
  });

  it('toggles the section from its header', () => {
    renderComponent();

    fireEvent.click(
      screen.getByTestId(`multichain-private-key-row-toggle-${CHAIN_ID}`),
    );

    expect(mockOnToggle).toHaveBeenCalledTimes(1);
  });

  it('does not render an interactive header for a single section', () => {
    renderComponent({ isCollapsible: false });

    const header = screen.getByTestId(
      `multichain-private-key-row-toggle-${CHAIN_ID}`,
    );
    fireEvent.click(header);

    expect(mockOnToggle).not.toHaveBeenCalled();
    expect(
      screen.queryByTestId(
        `multichain-private-key-row-toggle-icon-${CHAIN_ID}`,
      ),
    ).not.toBeInTheDocument();
    expect(header).not.toHaveClass('hover:bg-hover');
  });

  it('obscures the private key until tapped', () => {
    renderComponent();

    const revealButton = screen.getByTestId(
      `multichain-private-key-reveal-${CHAIN_ID}`,
    );
    const privateKey = screen.getByTestId(
      `multichain-private-key-value-${CHAIN_ID}`,
    );
    expect(revealButton).toHaveClass('bg-background-section');
    expect(revealButton).toHaveClass('items-start');
    expect(privateKey).toHaveStyle({ filter: 'blur(8px)' });
    expect(privateKey).not.toHaveTextContent(PRIVATE_KEY);

    fireEvent.click(revealButton);

    expect(privateKey).not.toHaveStyle({ filter: 'blur(8px)' });
    expect(privateKey).toHaveTextContent(PRIVATE_KEY);
  });

  it('copies the private key without revealing it', () => {
    renderComponent();

    const copyButton = screen.getByTestId(
      `multichain-private-key-copy-${CHAIN_ID}`,
    );
    expect(copyButton).toHaveTextContent('copy');
    expect(copyButton).toHaveClass('rounded-lg');

    fireEvent.click(copyButton);

    expect(mockOnCopy).toHaveBeenCalledTimes(1);
    expect(
      screen.getByText('multichainAccountPrivateKeyCopied'),
    ).toBeInTheDocument();
    expect(copyButton).toHaveClass('bg-success-muted', 'text-success-default');
    expect(
      screen.getByTestId(`multichain-private-key-value-${CHAIN_ID}`),
    ).toHaveStyle({ filter: 'blur(8px)' });

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(copyButton).toHaveTextContent('copy');
    expect(copyButton).not.toHaveClass(
      'bg-success-muted',
      'text-success-default',
    );
  });

  it('hides the private key content while collapsed', () => {
    renderComponent({ isExpanded: false });

    expect(
      screen.queryByTestId(`multichain-private-key-reveal-${CHAIN_ID}`),
    ).not.toBeInTheDocument();
  });
});
