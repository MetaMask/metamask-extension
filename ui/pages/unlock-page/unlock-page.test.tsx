import React from 'react';
import configureMockStore, { MockStore } from 'redux-mock-store';
import { fireEvent, waitFor, screen } from '@testing-library/react';
import thunk from 'redux-thunk';
import { createBrowserHistory, History as HistoryType } from 'history';
import { renderWithProvider } from '../../../test/lib/render-helpers';
import { DEFAULT_ROUTE } from '../../helpers/constants/routes';
import UnlockPage from './unlock-page';

// Mock the actions
const mockMarkPasswordForgotten = jest.fn();
const mockTryUnlockMetamask = jest.fn();
const mockForceUpdateMetamaskState = jest.fn();

jest.mock('../../store/actions.ts', () => ({
  markPasswordForgotten: () => mockMarkPasswordForgotten,
  tryUnlockMetamask: (password: string) => mockTryUnlockMetamask(password),
  forceUpdateMetamaskState: () => mockForceUpdateMetamaskState,
}));

// Mock MetaMask logo
const mockElement = document.createElement('svg');

jest.mock('@metamask/logo', () => () => {
  return {
    container: mockElement,
    setFollowMouse: jest.fn(),
    stopAnimation: jest.fn(),
    lookAt: jest.fn(),
    lookAtAndRender: jest.fn(),
  };
});

// Mock build types
jest.mock('../../helpers/utils/build-types', () => ({
  isFlask: () => false,
  isBeta: () => false,
}));

type MockState = {
  metamask: {
    isUnlocked?: boolean;
  };
};

type MockProps = {
  history: HistoryType;
  isUnlocked?: boolean;
  onRestore: jest.Mock;
  onSubmit: jest.Mock;
  forceUpdateMetamaskState: jest.Mock;
};

describe('Unlock Page', () => {
  let mockStore: MockStore;
  let mockHistory: History;
  let defaultProps: MockProps;

  beforeEach(() => {
    process.env.METAMASK_BUILD_TYPE = 'main';

    const mockState: MockState = {
      metamask: {
        isUnlocked: false,
      },
    };

    mockStore = configureMockStore([thunk])(mockState);
    mockHistory = createBrowserHistory();

    defaultProps = {
      history: mockHistory,
      isUnlocked: false,
      onRestore: jest.fn(),
      onSubmit: jest.fn().mockResolvedValue(undefined),
      forceUpdateMetamaskState: jest.fn().mockResolvedValue(undefined),
    };

    // Clear all mocks
    jest.clearAllMocks();
  });

  it('should match snapshot', () => {
    const { container } = renderWithProvider(
      <UnlockPage {...defaultProps} />,
      mockStore,
    );

    expect(container).toMatchSnapshot();
  });

  it('should redirect to default route when already unlocked', () => {
    const historySpy = jest.spyOn(mockHistory, 'push');
    const props = {
      ...defaultProps,
      isUnlocked: true,
    };

    renderWithProvider(<UnlockPage {...props} />, mockStore);

    expect(historySpy).toHaveBeenCalledWith(DEFAULT_ROUTE);
  });

  it('should render welcome back title and unlock message', () => {
    renderWithProvider(<UnlockPage {...defaultProps} />, mockStore);

    expect(screen.getByTestId('unlock-page-title')).toBeInTheDocument();
    expect(screen.getByText('Welcome back')).toBeInTheDocument();
    expect(
      screen.getByText('The decentralized web awaits'),
    ).toBeInTheDocument();
  });

  it('should have submit button disabled when password is empty', () => {
    renderWithProvider(<UnlockPage {...defaultProps} />, mockStore);

    const submitButton = screen.getByTestId('unlock-submit');
    expect(submitButton).toBeDisabled();
  });

  it('should enable submit button when password is entered', () => {
    renderWithProvider(<UnlockPage {...defaultProps} />, mockStore);

    const passwordField = screen.getByTestId('unlock-password');
    const submitButton = screen.getByTestId('unlock-submit');

    fireEvent.change(passwordField, { target: { value: 'test-password' } });

    expect(submitButton).not.toBeDisabled();
  });

  it('should change password field value and submit form', async () => {
    const onSubmitSpy = jest.fn().mockResolvedValue(undefined);
    const props = {
      ...defaultProps,
      onSubmit: onSubmitSpy,
    };

    renderWithProvider(<UnlockPage {...props} />, mockStore);

    const passwordField = screen.getByTestId('unlock-password');
    const submitButton = screen.getByTestId('unlock-submit');

    // Enter password
    fireEvent.change(passwordField, { target: { value: 'test-password' } });
    expect(passwordField).toHaveValue('test-password');

    // Submit form
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(onSubmitSpy).toHaveBeenCalledWith('test-password');
    });
  });

  it('should handle form submission with Enter key', async () => {
    const onSubmitSpy = jest.fn().mockResolvedValue(undefined);
    const props = {
      ...defaultProps,
      onSubmit: onSubmitSpy,
    };

    renderWithProvider(<UnlockPage {...props} />, mockStore);

    const passwordField = screen.getByTestId('unlock-password');
    const form = screen.getByRole('form');

    // Enter password
    fireEvent.change(passwordField, { target: { value: 'test-password' } });

    // Submit with Enter key
    fireEvent.submit(form);

    await waitFor(() => {
      expect(onSubmitSpy).toHaveBeenCalledWith('test-password');
    });
  });

  it('should display error message when submission fails', async () => {
    const errorMessage = 'Incorrect password';
    const onSubmitSpy = jest.fn().mockRejectedValue(new Error(errorMessage));
    const props = {
      ...defaultProps,
      onSubmit: onSubmitSpy,
    };

    renderWithProvider(<UnlockPage {...props} />, mockStore);

    const passwordField = screen.getByTestId('unlock-password');
    const submitButton = screen.getByTestId('unlock-submit');

    // Enter password and submit
    fireEvent.change(passwordField, { target: { value: 'wrong-password' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('should clear error when password field changes', async () => {
    const errorMessage = 'Incorrect password';
    const onSubmitSpy = jest.fn().mockRejectedValue(new Error(errorMessage));
    const props = {
      ...defaultProps,
      onSubmit: onSubmitSpy,
    };

    renderWithProvider(<UnlockPage {...props} />, mockStore);

    const passwordField = screen.getByTestId('unlock-password');
    const submitButton = screen.getByTestId('unlock-submit');

    // Enter password, submit, and get error
    fireEvent.change(passwordField, { target: { value: 'wrong-password' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    // Change password field - error should clear
    fireEvent.change(passwordField, { target: { value: 'new-password' } });

    await waitFor(() => {
      expect(screen.queryByText(errorMessage)).not.toBeInTheDocument();
    });
  });

  it('should call onRestore when forgot password link is clicked', () => {
    const onRestoreSpy = jest.fn();
    const props = {
      ...defaultProps,
      onRestore: onRestoreSpy,
    };

    renderWithProvider(<UnlockPage {...props} />, mockStore);

    const forgotPasswordLink = screen.getByText('Forgot password?');
    fireEvent.click(forgotPasswordLink);

    expect(onRestoreSpy).toHaveBeenCalledTimes(1);
  });

  it('should render support link with correct attributes', () => {
    renderWithProvider(<UnlockPage {...defaultProps} />, mockStore);

    const supportLink = screen.getByText('MetaMask support');
    expect(supportLink).toHaveAttribute('href', 'https://support.metamask.io');
    expect(supportLink).toHaveAttribute('target', '_blank');
    expect(supportLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('should show beta badge when isBeta returns true', () => {
    // Mock isBeta to return true
    jest.doMock('../../helpers/utils/build-types', () => ({
      isFlask: () => false,
      isBeta: () => true,
    }));

    renderWithProvider(<UnlockPage {...defaultProps} />, mockStore);

    expect(screen.getByText('beta')).toBeInTheDocument();
  });

  it('should not submit form with empty password', async () => {
    const onSubmitSpy = jest.fn();
    const props = {
      ...defaultProps,
      onSubmit: onSubmitSpy,
    };

    renderWithProvider(<UnlockPage {...props} />, mockStore);

    const form = screen.getByRole('form');
    fireEvent.submit(form);

    // Wait a bit to ensure async operations complete
    await waitFor(() => {
      expect(onSubmitSpy).not.toHaveBeenCalled();
    });
  });

  it('should prevent double submission when submitting is in progress', async () => {
    let resolveSubmit: (value?: unknown) => void;
    const submitPromise = new Promise((resolve) => {
      resolveSubmit = resolve;
    });

    const onSubmitSpy = jest.fn().mockReturnValue(submitPromise);
    const props = {
      ...defaultProps,
      onSubmit: onSubmitSpy,
    };

    renderWithProvider(<UnlockPage {...props} />, mockStore);

    const passwordField = screen.getByTestId('unlock-password');
    const submitButton = screen.getByTestId('unlock-submit');

    // Enter password
    fireEvent.change(passwordField, { target: { value: 'test-password' } });

    // Click submit multiple times quickly
    fireEvent.click(submitButton);
    fireEvent.click(submitButton);
    fireEvent.click(submitButton);

    // Only one submission should occur
    expect(onSubmitSpy).toHaveBeenCalledTimes(1);

    // Resolve the promise to complete the test
    resolveSubmit!();
    await waitFor(() => {
      expect(onSubmitSpy).toHaveBeenCalledWith('test-password');
    });
  });
});
