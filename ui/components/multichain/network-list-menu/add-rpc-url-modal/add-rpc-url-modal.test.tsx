import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { jsonRpcRequest } from '../../../../../shared/lib/rpc.utils';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import AddRpcUrlModal from './add-rpc-url-modal';

jest.mock('../../../../hooks/useI18nContext', () => ({
  useI18nContext: jest.fn(),
}));

jest.mock('../../../../../shared/lib/rpc.utils', () => ({
  jsonRpcRequest: jest.fn(),
}));

describe('AddRpcUrlModal', () => {
  const useI18nContextMock = useI18nContext as jest.Mock;
  const jsonRpcRequestMock = jsonRpcRequest as jest.Mock;

  beforeEach(() => {
    useI18nContextMock.mockReturnValue((key: string) => key);
    jsonRpcRequestMock.mockResolvedValue('0x1');
    jest.clearAllMocks();
  });

  it('should render correctly', () => {
    const { container } = render(<AddRpcUrlModal onAdded={() => undefined} />);
    expect(container).toMatchSnapshot();
  });

  it('should render the "Add URL" button with correct text', () => {
    render(<AddRpcUrlModal onAdded={() => undefined} />);
    const addButton = screen.getByRole('button', { name: 'addUrl' });
    expect(addButton).toBeInTheDocument();
  });

  it('disables the "Add URL" button when the RPC URL is empty', () => {
    render(<AddRpcUrlModal onAdded={() => null} />);
    expect(screen.getByRole('button', { name: 'addUrl' })).toBeDisabled();
  });

  it('disables the "Add URL" button when the RPC URL returns a different chain ID', async () => {
    jsonRpcRequestMock.mockResolvedValue('0x38');

    render(
      <AddRpcUrlModal onAdded={jest.fn()} expectedChainId="0x1" />,
    );

    await act(async () => {
      fireEvent.change(screen.getByTestId('rpc-url-input-test'), {
        target: { value: 'https://bsc-dataseed.binance.org/' },
      });
    });

    expect(
      await screen.findByText('endpointReturnedDifferentChainId'),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'addUrl' })).toBeDisabled();
    });
  });
});
