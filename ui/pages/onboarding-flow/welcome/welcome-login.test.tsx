import React from 'react';
import { fireEvent, waitFor, act } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import * as Environment from '../../../../shared/lib/environment';
import configureStore from '../../../store/store';
import WelcomeLogin from './welcome-login';
import { LOGIN_OPTION, LOGIN_TYPE } from './types';

describe('Welcome login', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it('should render', () => {
    jest
      .spyOn(Environment, 'getIsSeedlessOnboardingFeatureEnabled')
      .mockReturnValue(true);

    const mockOnLogin = jest.fn();
    const store = configureStore({});
    const { getByTestId, getByText } = renderWithProvider(
      <WelcomeLogin onLogin={mockOnLogin} isAnimationComplete={false} />,
      store,
    );
    expect(getByTestId('get-started')).toBeInTheDocument();

    const importButton = getByText(messages.onboardingImportWallet.message);
    expect(importButton).toBeInTheDocument();

    const createButton = getByText(messages.onboardingCreateWallet.message);
    expect(createButton).toBeInTheDocument();
  });

  it('should display Login Options modal when seedless onboarding feature is enabled', async () => {
    jest
      .spyOn(Environment, 'getIsSeedlessOnboardingFeatureEnabled')
      .mockReturnValue(true);

    const mockOnLogin = jest.fn();

    const store = configureStore({});
    const { getByTestId, getByText } = renderWithProvider(
      <WelcomeLogin onLogin={mockOnLogin} isAnimationComplete={true} />,
      store,
    );
    expect(getByTestId('get-started')).toBeInTheDocument();

    const importButton = getByText(messages.onboardingImportWallet.message);
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

  it('calls onLogin directly with SRP when seedless onboarding feature is disabled', async () => {
    jest
      .spyOn(Environment, 'getIsSeedlessOnboardingFeatureEnabled')
      .mockReturnValue(false);

    const mockOnLogin = jest.fn().mockResolvedValue(undefined);
    const store = configureStore({});
    const { getByText, queryByTestId } = renderWithProvider(
      <WelcomeLogin onLogin={mockOnLogin} isAnimationComplete={true} />,
      store,
    );

    const importButton = getByText(messages.onboardingSrpImport.message);
    expect(importButton).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(importButton);
    });

    await waitFor(() => {
      expect(mockOnLogin).toHaveBeenCalledWith(
        LOGIN_TYPE.SRP,
        LOGIN_OPTION.EXISTING,
      );
      expect(
        queryByTestId('onboarding-import-with-srp-button'),
      ).not.toBeInTheDocument();
    });
  });
});
