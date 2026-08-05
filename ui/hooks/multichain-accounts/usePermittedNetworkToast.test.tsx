import React from 'react';
import { fireEvent, render, renderHook, screen } from '@testing-library/react';
import type { MultichainNetworkConfiguration } from '@metamask/multichain-network-controller';
import { REVIEW_PERMISSIONS } from '../../helpers/constants/routes';
import {
  permittedNetworkToastId,
  usePermittedNetworkToast,
} from './usePermittedNetworkToast';

const mockNavigate = jest.fn();
const mockToastSuccess = jest.fn();
const mockToastDismiss = jest.fn();
const mockT = jest.fn((key: string, args?: string[]) => {
  if (key === 'permittedChainToastUpdate') {
    return `${args?.[0]}::${args?.[1]}`;
  }
  if (key === 'editPermissions') {
    return 'edit-permissions-action';
  }
  return key;
});

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('../useI18nContext', () => ({
  useI18nContext: () => mockT,
}));

jest.mock('../../components/ui/toast/toast', () => ({
  toast: {
    success: (...args: unknown[]) => mockToastSuccess(...args),
    dismiss: (...args: unknown[]) => mockToastDismiss(...args),
  },
  ToastContent: ({
    title,
    actionText,
    onActionClick,
    dataTestId,
  }: {
    title: string;
    actionText?: string;
    onActionClick?: () => void;
    dataTestId?: string;
  }) => (
    <div data-testid={dataTestId}>
      <span>{title}</span>
      {onActionClick && actionText ? (
        <button type="button" onClick={onActionClick}>
          {actionText}
        </button>
      ) : null}
    </div>
  ),
}));

jest.mock('../../../shared/lib/network.utils', () => ({
  getNetworkIcon: () => 'network-icon.svg',
}));

const network = {
  chainId: 'eip155:1',
  name: 'Ethereum Mainnet',
  isEvm: true,
} as unknown as MultichainNetworkConfiguration;

describe('usePermittedNetworkToast', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows a success toast with host, network name, and edit-permissions action', () => {
    const { result } = renderHook(() => usePermittedNetworkToast());

    result.current.showPermittedNetworkToast({
      origin: 'https://dapp.example.com',
      network,
    });

    expect(mockToastSuccess).toHaveBeenCalledTimes(1);
    const [content, options] = mockToastSuccess.mock.calls[0];
    expect(options).toEqual(
      expect.objectContaining({
        id: permittedNetworkToastId,
        duration: Infinity,
      }),
    );

    render(content);
    expect(
      screen.getByText('dapp.example.com::Ethereum Mainnet'),
    ).toBeInTheDocument();
    expect(screen.getByTestId(permittedNetworkToastId)).toBeInTheDocument();

    fireEvent.click(screen.getByText('edit-permissions-action'));
    expect(mockToastDismiss).toHaveBeenCalledWith(permittedNetworkToastId);
    expect(mockNavigate).toHaveBeenCalledWith(
      `${REVIEW_PERMISSIONS}?origin=${encodeURIComponent('https://dapp.example.com')}`,
    );
  });

  it('dismisses the permitted-network toast by id', () => {
    const { result } = renderHook(() => usePermittedNetworkToast());

    result.current.dismissPermittedNetworkToast();

    expect(mockToastDismiss).toHaveBeenCalledWith(permittedNetworkToastId);
  });
});
