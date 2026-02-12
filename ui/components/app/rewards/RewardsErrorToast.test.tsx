import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useSelector, useDispatch } from 'react-redux';
import { setErrorToast } from '../../../ducks/rewards';
import RewardsErrorToast from './RewardsErrorToast';

jest.mock('react-redux', () => {
  const actual = jest.requireActual('react-redux');
  return {
    ...actual,
    useSelector: jest.fn(),
    useDispatch: jest.fn(),
  };
});

const mockUseSelector = useSelector as jest.MockedFunction<typeof useSelector>;
const mockUseDispatch = useDispatch as jest.MockedFunction<typeof useDispatch>;

describe('RewardsErrorToast', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders nothing when isOpen is false', () => {
    mockUseSelector.mockReturnValue({
      isOpen: false,
      title: '',
      description: '',
      actionText: '',
      onActionClick: undefined,
    });

    render(<RewardsErrorToast />);
    expect(screen.queryByTestId('rewards-error-toast')).toBeNull();
  });

  it('renders ToastContainer and content when open', () => {
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

    expect(screen.getByTestId('rewards-error-toast')).toBeInTheDocument();
    expect(screen.getByText(title)).toBeInTheDocument();
    expect(screen.getByText(description)).toBeInTheDocument();
    expect(screen.getByText(actionText)).toBeInTheDocument();

    fireEvent.click(screen.getByText(actionText));
    expect(onActionClick).toHaveBeenCalledTimes(1);
  });

  it('dispatches setErrorToast to close when close button is clicked', () => {
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

    render(<RewardsErrorToast />);

    const closeButton = document.querySelector(
      '.mm-banner-base__close-button',
    ) as HTMLElement | null;
    expect(closeButton).toBeTruthy();
    if (closeButton) {
      fireEvent.click(closeButton);
    }

    const expectedAction = setErrorToast({
      isOpen: false,
      title,
      description,
      actionText,
      onActionClick,
    });
    expect(mockDispatch).toHaveBeenCalledWith(expectedAction);
  });

  it('does not render action button when actionText is not provided', () => {
    mockUseSelector.mockReturnValue({
      isOpen: true,
      title: 'Error',
      description: 'No action available',
      actionText: undefined,
      onActionClick: undefined,
    });

    render(<RewardsErrorToast />);
    expect(screen.getByTestId('rewards-error-toast')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /retry/iu })).toBeNull();
  });
});
