import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { toast as hotToast } from 'react-hot-toast';
import { ToastContent, toast } from './toast';

jest.mock('../status-icon/status-icon', () => ({
  StatusIcon: () => null,
}));

jest.mock('react-hot-toast', () => {
  const actual =
    jest.requireActual<typeof import('react-hot-toast')>('react-hot-toast');
  return {
    ...actual,
    toast: {
      ...actual.toast,
      success: jest.fn(() => 'toast-id'),
      error: jest.fn(() => 'toast-id'),
      loading: jest.fn(() => 'toast-id'),
      promise: jest.fn((promise) => promise),
      dismiss: jest.fn(),
      remove: jest.fn(),
    },
  };
});

describe('ToastContent', () => {
  it('renders the title', () => {
    render(<ToastContent title="Transaction pending" />);
    expect(screen.getByText('Transaction pending')).toBeInTheDocument();
  });

  it('renders the description when provided', () => {
    render(
      <ToastContent
        title="Withdrawal complete"
        description="$20.73 BNB moved to your wallet"
      />,
    );

    expect(screen.getByText('$20.73 BNB moved to your wallet')).toHaveClass(
      'mt-1',
    );
  });

  it('renders an action button when onActionClick is provided', () => {
    const onActionClick = jest.fn();
    render(
      <ToastContent
        title="Transaction confirmed"
        actionText="test-action"
        onActionClick={onActionClick}
      />,
    );
    fireEvent.click(screen.getByText('test-action'));
    expect(onActionClick).toHaveBeenCalledTimes(1);
  });

  it('does not render an action button when onActionClick is not provided', () => {
    render(
      <ToastContent title="Transaction confirmed" actionText="test-action" />,
    );
    expect(screen.queryByText('test-action')).not.toBeInTheDocument();
  });
});

describe('toast', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('toast.success builds ToastContent from params', () => {
    toast.success(
      {
        title: 'Networks updated',
        id: 'network-permission-toast',
      },
      {
        duration: Infinity,
      },
    );

    expect(hotToast.success).toHaveBeenCalledWith(
      expect.objectContaining({
        props: {
          title: 'Networks updated',
          description: undefined,
          actionText: undefined,
          onActionClick: undefined,
          dataTestId: 'network-permission-toast',
        },
      }),
      {
        id: 'network-permission-toast',
        duration: Infinity,
      },
    );
  });

  it('toast.error passes through options without forcing a duration', () => {
    toast.error({
      title: 'Failed',
      description: 'Try again',
      id: 'error-toast',
    });

    expect(hotToast.error).toHaveBeenCalledWith(
      expect.objectContaining({
        props: expect.objectContaining({
          title: 'Failed',
          description: 'Try again',
          dataTestId: 'error-toast',
        }),
      }),
      {
        id: 'error-toast',
      },
    );
  });

  it('toast.loading accepts an icon override', () => {
    toast.loading(
      {
        title: 'Loading',
        id: 'loading-toast',
      },
      {
        icon: null,
      },
    );

    expect(hotToast.loading).toHaveBeenCalledWith(
      expect.objectContaining({
        props: expect.objectContaining({
          title: 'Loading',
          dataTestId: 'loading-toast',
        }),
      }),
      {
        id: 'loading-toast',
        icon: null,
      },
    );
  });

  it('toast.promise builds ToastContent for each stage', async () => {
    const work = Promise.resolve({ amount: '10' });

    await toast.promise(
      work,
      {
        loading: {
          title: 'Sending',
          id: 'send-toast',
        },
        success: (data) => ({
          title: 'Sent',
          description: data.amount,
          id: 'send-toast',
        }),
        error: {
          title: 'Failed',
          id: 'send-toast',
        },
      },
      {
        success: {
          duration: 5_000,
        },
      },
    );

    expect(hotToast.promise).toHaveBeenCalledWith(
      work,
      {
        loading: expect.objectContaining({
          props: expect.objectContaining({
            title: 'Sending',
            dataTestId: 'send-toast',
          }),
        }),
        success: expect.any(Function),
        error: expect.any(Function),
      },
      {
        id: 'send-toast',
        success: {
          duration: 5_000,
        },
      },
    );

    const msgs = jest.mocked(hotToast.promise).mock.calls[0][1];
    expect(msgs.success?.({ amount: '10' } as never)).toEqual(
      expect.objectContaining({
        props: expect.objectContaining({
          title: 'Sent',
          description: '10',
          dataTestId: 'send-toast',
        }),
      }),
    );
    expect(msgs.error?.(new Error('nope'))).toEqual(
      expect.objectContaining({
        props: expect.objectContaining({
          title: 'Failed',
          dataTestId: 'send-toast',
        }),
      }),
    );
  });
});
