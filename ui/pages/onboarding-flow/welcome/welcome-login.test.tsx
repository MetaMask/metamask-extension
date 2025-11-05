import React from 'react';
import { fireEvent, waitFor, act } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../store/store';
import WelcomeLogin from './welcome-login';

describe('Welcome login', () => {
  it('should render', () => {
    const mockOnLogin = jest.fn();
    const store = configureStore({});
    const { getByTestId, getByText } = renderWithProvider(
      <WelcomeLogin onLogin={mockOnLogin} isAnimationComplete={false} />,
      store,
    );
    expect(getByTestId('get-started')).toBeInTheDocument();

    const importButton = getByText('I have an existing wallet');
    expect(importButton).toBeInTheDocument();

    const createButton = getByText('Create a new wallet');
    expect(createButton).toBeInTheDocument();
  });

  it('should display Login Options modal when seedless onboarding feature is enabled', async () => {
    const mockOnLogin = jest.fn();

    const store = configureStore({});
    const { getByTestId, getByText } = renderWithProvider(
      <WelcomeLogin onLogin={mockOnLogin} isAnimationComplete={true} />,
      store,
    );
    expect(getByTestId('get-started')).toBeInTheDocument();

    const importButton = getByText('I have an existing wallet');
    expect(importButton).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(importButton);
      await new Promise((resolve) => setTimeout(resolve, 500));
    });

    await waitFor(() => {
      expect(mockOnLogin).not.toHaveBeenCalled();
      expect(
        getByTestId('onboarding-import-with-srp-button'),
      ).toBeInTheDocument();
    });
  });
});
