import React from 'react';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { useI18nContext } from '../../hooks/useI18nContext';
import { JsonRpcRequestError } from '../../../shared/lib/rpc.utils';
import { useSafeChains } from '../../components/multichain/networks-form/use-safe-chains';
import { AddRpcUrlPageForm } from './add-rpc-url-page-form';

const mockJsonRpcRequest = jest.fn();

jest.mock('../../../shared/lib/rpc.utils', () => ({
  ...jest.requireActual('../../../shared/lib/rpc.utils'),
  jsonRpcRequest: (...args: unknown[]) => mockJsonRpcRequest(...args),
}));

jest.mock('../../hooks/useI18nContext', () => ({
  useI18nContext: jest.fn(),
}));

jest.mock('../../components/multichain/networks-form/use-safe-chains', () => ({
  useSafeChains: jest.fn(() => ({ safeChains: [] })),
}));

const mockUseSafeChains = jest.mocked(useSafeChains);

describe('AddRpcUrlPageForm', () => {
  const useI18nContextMock = useI18nContext as jest.Mock;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    mockJsonRpcRequest.mockResolvedValue('0x1');
    useI18nContextMock.mockReturnValue((key: string) => key);
    mockUseSafeChains.mockReturnValue({ safeChains: [] });
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
    fireEvent.blur(screen.getByTestId('rpc-url-input-test'));

    expect(screen.queryByText('failedToFetchChainId')).not.toBeInTheDocument();

    await act(async () => {
      jest.advanceTimersByTime(500);
    });

    expect(await screen.findByText('failedToFetchChainId')).toBeInTheDocument();
    expect(screen.getByTestId('page-container-footer-next')).toBeDisabled();

    fireEvent.click(screen.getByTestId('page-container-footer-next'));

    expect(onAdded).not.toHaveBeenCalled();
  });

  it('reports a rate limit instead of an incorrect URL when the provider throttles validation', async () => {
    const onAdded = jest.fn();
    mockJsonRpcRequest.mockRejectedValue(
      new JsonRpcRequestError('public rate limit exceeded', {
        code: -32029,
        httpStatus: 429,
      }),
    );
    render(<AddRpcUrlPageForm onCancel={() => undefined} onAdded={onAdded} />);

    fireEvent.change(screen.getByTestId('rpc-url-input-test'), {
      target: { value: 'https://lb.routeme.sh/rpc/evm/30' },
    });
    fireEvent.blur(screen.getByTestId('rpc-url-input-test'));

    await act(async () => {
      jest.advanceTimersByTime(500);
    });

    expect(await screen.findByText('rpcUrlRateLimited')).toBeInTheDocument();
    expect(screen.queryByText('failedToFetchChainId')).not.toBeInTheDocument();
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

    expect(screen.queryByText('urlErrorMsg')).not.toBeInTheDocument();

    fireEvent.blur(screen.getByTestId('rpc-url-input-test'));

    expect(screen.getByText('urlErrorMsg')).toBeInTheDocument();
    expect(mockJsonRpcRequest).not.toHaveBeenCalled();
  });

  it('shows a required error on submit when the URL is empty, and not on blur', () => {
    const onAdded = jest.fn();
    render(<AddRpcUrlPageForm onCancel={() => undefined} onAdded={onAdded} />);

    expect(screen.getByTestId('rpc-url-input-test')).not.toHaveFocus();

    fireEvent.blur(screen.getByTestId('rpc-url-input-test'));

    expect(screen.queryByText('fieldRequired')).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('page-container-footer-next'));

    expect(screen.getByText('fieldRequired')).toBeInTheDocument();
    expect(onAdded).not.toHaveBeenCalled();
  });

  it('updates a visible URL error as the value changes', () => {
    render(
      <AddRpcUrlPageForm
        onCancel={() => undefined}
        onAdded={() => undefined}
      />,
    );

    fireEvent.change(screen.getByTestId('rpc-url-input-test'), {
      target: { value: 'not a url' },
    });
    fireEvent.blur(screen.getByTestId('rpc-url-input-test'));

    expect(screen.getByText('invalidRPC')).toBeInTheDocument();

    fireEvent.change(screen.getByTestId('rpc-url-input-test'), {
      target: { value: 'rpc.example.com' },
    });

    expect(screen.getByText('urlErrorMsg')).toBeInTheDocument();
    expect(screen.queryByText('invalidRPC')).not.toBeInTheDocument();
  });

  it('suggests RPCs for the form chain and fills the URL and domain nickname', () => {
    mockUseSafeChains.mockReturnValue({
      safeChains: [
        {
          chainId: '100',
          name: 'Gnosis',
          nativeCurrency: { symbol: 'xDAI' },
          rpc: [
            'https://rpc.gnosischain.com',
            'https://gnosis-rpc.publicnode.com/foo',
          ],
        },
        {
          chainId: '1',
          name: 'Ethereum',
          nativeCurrency: { symbol: 'ETH' },
          rpc: ['https://cloudflare-eth.com'],
        },
      ],
    });

    render(
      <AddRpcUrlPageForm
        chainId="100"
        chainlistEnabled
        networkName="Gnosis"
        existingRpcUrls={['https://rpc.gnosischain.com']}
        onCancel={() => undefined}
        onAdded={() => undefined}
      />,
    );

    fireEvent.focus(screen.getByTestId('rpc-url-input-test'));

    expect(screen.getByTestId('add-rpc-network-name')).toHaveTextContent(
      'Gnosis',
    );
    expect(screen.getByText('gnosis-rpc.publicnode.com')).toBeInTheDocument();
    expect(
      screen.queryByText('https://rpc.gnosischain.com'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText('https://cloudflare-eth.com'),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('gnosis-rpc.publicnode.com'));

    expect(screen.getByTestId('rpc-url-input-test')).toHaveValue(
      'https://gnosis-rpc.publicnode.com/foo',
    );
    expect(screen.getByTestId('rpc-name-input-test')).toHaveValue(
      'gnosis-rpc.publicnode.com',
    );
    expect(
      screen.queryByTestId('add-rpc-chainlist-suggestions'),
    ).not.toBeInTheDocument();
  });

  it('does not suggest Chainlist RPCs when the feature flag is off', () => {
    mockUseSafeChains.mockReturnValue({
      safeChains: [
        {
          chainId: '100',
          name: 'Gnosis',
          nativeCurrency: { symbol: 'xDAI' },
          rpc: ['https://gnosis-rpc.publicnode.com'],
        },
      ],
    });

    render(
      <AddRpcUrlPageForm
        chainId="100"
        onCancel={() => undefined}
        onAdded={() => undefined}
      />,
    );

    fireEvent.focus(screen.getByTestId('rpc-url-input-test'));
    fireEvent.change(screen.getByTestId('rpc-url-input-test'), {
      target: { value: 'https://gnosis-rpc.publicnode.com' },
    });

    expect(
      screen.queryByTestId('add-rpc-chainlist-suggestions'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('add-rpc-chainlist-no-matches'),
    ).not.toBeInTheDocument();
  });

  it('does not fill the nickname when the URL is typed instead of selected', () => {
    mockUseSafeChains.mockReturnValue({
      safeChains: [
        {
          chainId: '100',
          name: 'Gnosis',
          nativeCurrency: { symbol: 'xDAI' },
          rpc: ['https://gnosis-rpc.publicnode.com'],
        },
      ],
    });

    render(
      <AddRpcUrlPageForm
        chainId="100"
        onCancel={() => undefined}
        onAdded={() => undefined}
      />,
    );

    fireEvent.change(screen.getByTestId('rpc-url-input-test'), {
      target: { value: 'https://custom.example.com' },
    });
    fireEvent.change(screen.getByTestId('rpc-name-input-test'), {
      target: { value: 'My RPC' },
    });

    expect(screen.getByTestId('rpc-url-input-test')).toHaveValue(
      'https://custom.example.com',
    );
    expect(screen.getByTestId('rpc-name-input-test')).toHaveValue('My RPC');
  });

  it('offers the typed URL when Chainlist has no RPC match', () => {
    mockUseSafeChains.mockReturnValue({
      safeChains: [
        {
          chainId: '100',
          name: 'Gnosis',
          nativeCurrency: { symbol: 'xDAI' },
          rpc: ['https://gnosis-rpc.publicnode.com'],
        },
      ],
    });

    render(
      <AddRpcUrlPageForm
        chainId="100"
        chainlistEnabled
        onCancel={() => undefined}
        onAdded={() => undefined}
      />,
    );

    fireEvent.focus(screen.getByTestId('rpc-url-input-test'));
    fireEvent.change(screen.getByTestId('rpc-url-input-test'), {
      target: { value: 'https://custom.example.com' },
    });

    expect(screen.getByText('chainlistNoMatches')).toBeInTheDocument();
    expect(screen.getByText('chainlistUseTypedRpcUrl')).toBeInTheDocument();
    expect(
      screen.getByText('chainlistEnterRpcUrlManually'),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId('add-rpc-chainlist-source-banner'),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('add-rpc-chainlist-use-typed-url'));

    expect(screen.getByTestId('rpc-url-input-test')).toHaveValue(
      'https://custom.example.com',
    );
    expect(screen.getByTestId('rpc-name-input-test')).toHaveValue('');
    expect(
      screen.queryByTestId('add-rpc-chainlist-no-matches'),
    ).not.toBeInTheDocument();
  });
});
