import React from 'react';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { useI18nContext } from '../../hooks/useI18nContext';
import { AddRpcUrlPageForm } from './add-rpc-url-page-form';

const mockJsonRpcRequest = jest.fn();

jest.mock('../../../shared/lib/rpc.utils', () => ({
  jsonRpcRequest: (...args: unknown[]) => mockJsonRpcRequest(...args),
}));

jest.mock('../../hooks/useI18nContext', () => ({
  useI18nContext: jest.fn(),
}));

describe('AddRpcUrlPageForm', () => {
  const useI18nContextMock = useI18nContext as jest.Mock;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    mockJsonRpcRequest.mockResolvedValue('0x1');
    useI18nContextMock.mockReturnValue((key: string) => key);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('keeps Add URL disabled while RPC validation is pending', () => {
    mockJsonRpcRequest.mockReturnValue(new Promise(() => undefined));
    render(
      <AddRpcUrlPageForm
        onCancel={() => undefined}
        onAdded={() => undefined}
      />,
    );

    fireEvent.change(screen.getByTestId('rpc-url-input-test'), {
      target: { value: 'https://rpc.example.com' },
    });

    expect(screen.getByTestId('page-container-footer-next')).toBeDisabled();
  });

  it('disables Add URL when RPC validation fails', async () => {
    const onAdded = jest.fn();
    mockJsonRpcRequest.mockRejectedValue(new Error('invalid rpc'));
    render(<AddRpcUrlPageForm onCancel={() => undefined} onAdded={onAdded} />);

    fireEvent.change(screen.getByTestId('rpc-url-input-test'), {
      target: { value: 'https://invalid-rpc.example.com' },
    });

    expect(screen.queryByText('failedToFetchChainId')).not.toBeInTheDocument();

    await act(async () => {
      jest.advanceTimersByTime(500);
    });

    expect(await screen.findByText('failedToFetchChainId')).toBeInTheDocument();
    expect(screen.getByTestId('page-container-footer-next')).toBeDisabled();

    fireEvent.click(screen.getByTestId('page-container-footer-next'));

    expect(onAdded).not.toHaveBeenCalled();
  });

  it('enables Add URL when RPC validation succeeds', async () => {
    const onAdded = jest.fn();
    render(<AddRpcUrlPageForm onCancel={() => undefined} onAdded={onAdded} />);

    fireEvent.change(screen.getByTestId('rpc-url-input-test'), {
      target: { value: 'https://rpc.example.com' },
    });

    await act(async () => {
      jest.advanceTimersByTime(500);
    });

    await waitFor(() =>
      expect(screen.getByTestId('page-container-footer-next')).toBeEnabled(),
    );
    expect(mockJsonRpcRequest).toHaveBeenCalledWith(
      'https://rpc.example.com/',
      'eth_chainId',
    );

    fireEvent.click(screen.getByTestId('page-container-footer-next'));

    expect(onAdded).toHaveBeenCalledWith('https://rpc.example.com', undefined);
  });

  it('does not validate RPC when the URL format is invalid', () => {
    render(
      <AddRpcUrlPageForm
        onCancel={() => undefined}
        onAdded={() => undefined}
      />,
    );

    fireEvent.change(screen.getByTestId('rpc-url-input-test'), {
      target: { value: 'rpc.example.com' },
    });

    expect(screen.getByText('urlErrorMsg')).toBeInTheDocument();
    expect(mockJsonRpcRequest).not.toHaveBeenCalled();
  });
});
