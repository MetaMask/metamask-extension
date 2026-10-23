import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
// eslint-disable-next-line import-x/no-restricted-paths
import messages from '../../../../app/_locales/en/messages.json';
import { MultichainPrivateKeyRow } from './multichain-private-key-row';

jest.mock('../../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string) => key,
}));

const CHAIN_ID = 'eip155:1';
const PRIVATE_KEY = 'private-key-mock';
const mockOnCopy = jest.fn().mockResolvedValue(true);
const mockOnClearClipboard = jest.fn();

const renderComponent = ({
  sensitiveClipboardState = 'idle',
}: {
  sensitiveClipboardState?: 'idle' | 'ready' | 'cleared' | 'error';
} = {}) =>
  render(
    <MultichainPrivateKeyRow
      address="0x1234567890abcdef1234567890abcdef12345678"
      chainId={CHAIN_ID}
      networkName={messages.ethereumAndEvms.message}
      onCopy={mockOnCopy}
      onClearClipboard={mockOnClearClipboard}
      privateKey={PRIVATE_KEY}
      sensitiveClipboardState={sensitiveClipboardState}
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

    expect(
      screen.getByText(messages.ethereumAndEvms.message),
    ).toBeInTheDocument();
    expect(screen.getByText('0x12345...45678')).toBeInTheDocument();
  });

  it('renders a non-interactive EVM header', () => {
    renderComponent();

    expect(
      screen.getByTestId(`multichain-private-key-row-header-${CHAIN_ID}`)
        .tagName,
    ).toBe('DIV');
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
    expect(revealButton.parentElement).toHaveClass('pb-1');
    expect(privateKey).toHaveStyle({ filter: 'blur(8px)' });
    expect(privateKey).not.toHaveTextContent(PRIVATE_KEY);

    fireEvent.click(revealButton);

    expect(privateKey).not.toHaveStyle({ filter: 'blur(8px)' });
    expect(privateKey).toHaveTextContent(PRIVATE_KEY);
  });

  it('copies the private key without revealing it', async () => {
    renderComponent();

    const copyButton = screen.getByTestId(
      `multichain-private-key-copy-${CHAIN_ID}`,
    );
    expect(copyButton).toHaveTextContent('copy');
    expect(copyButton).toHaveClass('rounded-lg');

    fireEvent.click(copyButton);

    expect(mockOnCopy).toHaveBeenCalledTimes(1);
    expect(
      await screen.findByText('multichainAccountPrivateKeyCopied'),
    ).toBeInTheDocument();
    expect(copyButton).toHaveClass('bg-success-muted', 'text-success-default');
    expect(
      screen.getByTestId(`multichain-private-key-value-${CHAIN_ID}`),
    ).toHaveStyle({
      filter: 'blur(8px)',
    });

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(copyButton).toHaveTextContent('copy');
    expect(copyButton).not.toHaveClass(
      'bg-success-muted',
      'text-success-default',
    );
  });

  it('renders the clipboard cleanup action inside the copied key row', () => {
    renderComponent({ sensitiveClipboardState: 'ready' });

    const row = screen.getByTestId(`multichain-private-key-row-${CHAIN_ID}`);
    const warning = screen.getByTestId('sensitive-clipboard-warning');

    expect(row).toContainElement(warning);
    expect(warning).toHaveClass('bg-warning-muted');

    fireEvent.click(screen.getByTestId('clear-sensitive-clipboard'));

    expect(mockOnClearClipboard).toHaveBeenCalledTimes(1);
  });
});
