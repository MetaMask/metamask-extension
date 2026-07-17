import React from 'react';
import { render, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useToasterStore } from 'react-hot-toast';
import { setErrorToast } from '../../../ducks/rewards';
import RewardsErrorToast from './RewardsErrorToast';

const mockToastDismiss = jest.fn();
const mockToastError = jest.fn();

jest.mock('react-redux', () => {
  const actual = jest.requireActual('react-redux');
  return {
    ...actual,
    useSelector: jest.fn(),
    useDispatch: jest.fn(),
  };
});

jest.mock('../../ui/toast/toast', () => ({
  toast: {
    dismiss: (...args: unknown[]) => mockToastDismiss(...args),
    error: (...args: unknown[]) => mockToastError(...args),
  },
  ToastContent: () => null,
}));

jest.mock('react-hot-toast', () => ({
  useToasterStore: jest.fn(() => ({ toasts: [] })),
}));

const mockUseSelector = useSelector as jest.MockedFunction<typeof useSelector>;
const mockUseDispatch = useDispatch as jest.MockedFunction<typeof useDispatch>;
const mockUseToasterStore = useToasterStore as jest.MockedFunction<
  typeof useToasterStore
>;

describe('RewardsErrorToast', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseToasterStore.mockReturnValue({
      toasts: [],
      settings: { toastLimit: 20 },
      pausedAt: undefined,
    } as ReturnType<typeof useToasterStore>);
  });

  it('does not show toast when isOpen is false', () => {
    mockUseSelector.mockReturnValue({
      isOpen: false,
      title: '',
      description: '',
      actionText: '',
      onActionClick: undefined,
    });

    render(<RewardsErrorToast />);

    expect(mockToastError).not.toHaveBeenCalled();
    expect(mockToastDismiss).toHaveBeenCalledWith('rewards-error-toast');
  });

  it('shows error toast when isOpen is true', () => {
    const onActionClick = jest.fn();
    const mockDispatch = jest.fn();
    mockUseDispatch.mockReturnValue(mockDispatch);

    const title = 'Something went wrong';
    const description = 'Please try again later';
    const actionText = 'Retry';

    mockUseSelector.mockReturnValue({
      isOpen: true,
      title,
      description,
      actionText,
      onActionClick,
    });

    render(<RewardsErrorToast />);

    expect(mockToastError).toHaveBeenCalledWith(
      expect.objectContaining({
        props: expect.objectContaining({
          title,
          description,
          actionText,
          onActionClick,
          dataTestId: 'rewards-error-toast',
        }),
      }),
      {
        id: 'rewards-error-toast',
        duration: Infinity,
      },
    );
  });

  it('dismisses toast on unmount', () => {
    mockUseSelector.mockReturnValue({
      isOpen: true,
      title: 'Error',
      description: 'Details',
      actionText: undefined,
      onActionClick: undefined,
    });

    const { unmount } = render(<RewardsErrorToast />);

    mockToastDismiss.mockClear();
    unmount();

    expect(mockToastDismiss).toHaveBeenCalledWith('rewards-error-toast');
  });

  it('dispatches setErrorToast to close when toast is dismissed', () => {
    const onActionClick = jest.fn();
    const mockDispatch = jest.fn();
    mockUseDispatch.mockReturnValue(mockDispatch);

    const title = 'Critical error';
    const description = 'Operation failed';
    const actionText = 'Details';

    mockUseSelector.mockReturnValue({
      isOpen: true,
      title,
      description,
      actionText,
      onActionClick,
    });

    mockUseToasterStore.mockReturnValue({
      toasts: [
        {
          id: 'rewards-error-toast',
          dismissed: true,
        },
      ],
    } as ReturnType<typeof useToasterStore>);

    render(<RewardsErrorToast />);

    const expectedAction = setErrorToast({
      isOpen: false,
      title,
      description,
      actionText,
      onActionClick,
    });
    expect(mockDispatch).toHaveBeenCalledWith(expectedAction);
  });

  it('does not dispatch close when toast content updates', () => {
    const mockDispatch = jest.fn();
    mockUseDispatch.mockReturnValue(mockDispatch);

    mockUseSelector.mockReturnValue({
      isOpen: true,
      title: 'Error',
      description: 'First message',
      actionText: undefined,
      onActionClick: undefined,
    });

    mockUseToasterStore.mockReturnValue({
      toasts: [
        {
          id: 'rewards-error-toast',
          dismissed: true,
        },
      ],
    } as ReturnType<typeof useToasterStore>);

    const { rerender } = render(<RewardsErrorToast />);

    mockDispatch.mockClear();
    mockUseToasterStore.mockReturnValue({
      toasts: [
        {
          id: 'rewards-error-toast',
          dismissed: false,
        },
      ],
    } as ReturnType<typeof useToasterStore>);
    mockUseSelector.mockReturnValue({
      isOpen: true,
      title: 'Error',
      description: 'Updated message',
      actionText: undefined,
      onActionClick: undefined,
    });

    act(() => {
      rerender(<RewardsErrorToast />);
    });

    expect(mockDispatch).not.toHaveBeenCalled();
    expect(mockToastError).toHaveBeenCalledTimes(2);
  });

  it('does not pass action props when actionText is not provided', () => {
    mockUseSelector.mockReturnValue({
      isOpen: true,
      title: 'Error',
      description: 'No action available',
      actionText: undefined,
      onActionClick: undefined,
    });

    render(<RewardsErrorToast />);

    expect(mockToastError).toHaveBeenCalledWith(
      expect.objectContaining({
        props: expect.objectContaining({
          title: 'Error',
          description: 'No action available',
          dataTestId: 'rewards-error-toast',
        }),
      }),
      {
        id: 'rewards-error-toast',
        duration: Infinity,
      },
    );
  });
});
