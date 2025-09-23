import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { waitFor, fireEvent } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import * as Actions from '../../../store/actions';
import * as Environment from '../../../../shared/modules/environment';
import * as BrowserRuntimeUtils from '../../../../shared/modules/browser-runtime.utils';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  MetaMetricsEventAccountType,
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { PLATFORM_FIREFOX } from '../../../../shared/constants/app';
import { ONBOARDING_CREATE_PASSWORD_ROUTE } from '../../../helpers/constants/routes';
import Welcome from './welcome';

const mockUseNavigate = jest.fn();

jest.mock('react-router-dom-v5-compat', () => {
  return {
    ...jest.requireActual('react-router-dom-v5-compat'),
    useNavigate: () => mockUseNavigate,
  };
});

const mockIntersectionObserver = jest.fn();
mockIntersectionObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null,
});
window.IntersectionObserver = mockIntersectionObserver;

describe('Welcome Page', () => {
  const mockState = {
    metamask: {
      internalAccounts: {
        accounts: {},
        selectedAccount: '',
      },
      metaMetricsId: '0x00000000',
    },
  };
  const mockStore = configureMockStore([thunk])(mockState);
  const mockTrackEvent = jest.fn();
  let startOAuthLoginSpy;
  let enabledMetricsSpy;

  beforeEach(() => {
    jest.resetAllMocks();
    startOAuthLoginSpy = jest
      .spyOn(Actions, 'startOAuthLogin')
      .mockReturnValueOnce(jest.fn().mockResolvedValueOnce(true));
    enabledMetricsSpy = jest.spyOn(Actions, 'setParticipateInMetaMetrics');
  });

  it('should render', () => {
    const { getByText } = renderWithProvider(<Welcome />, mockStore);

    expect(getByText(`Let's get started!`)).toBeInTheDocument();

    const createButton = getByText('Create a new wallet');
    expect(createButton).toBeInTheDocument();

    const importButton = getByText('I have an existing wallet');
    expect(importButton).toBeInTheDocument();
  });

  it('should render with seedless onboarding feature disabled', () => {
    jest
      .spyOn(Environment, 'getIsSeedlessOnboardingFeatureEnabled')
      .mockReturnValue(false);

    const { getByText } = renderWithProvider(<Welcome />, mockStore);

    expect(getByText(`Let's get started!`)).toBeInTheDocument();

    expect(Environment.getIsSeedlessOnboardingFeatureEnabled()).toBe(false);

    expect(
      getByText('Import using Secret Recovery Phrase'),
    ).toBeInTheDocument();

    jest
      .spyOn(Environment, 'getIsSeedlessOnboardingFeatureEnabled')
      .mockReturnValue(true);
  });

  it('should show the error modal when the error thrown in login', async () => {
    jest.resetAllMocks();
    jest
      .spyOn(Actions, 'startOAuthLogin')
      .mockReturnValueOnce(jest.fn().mockRejectedValueOnce(new Error('test')));

    const { getByText, getByTestId } = renderWithProvider(
      <Welcome />,
      mockStore,
    );

    const createButton = getByText('Create a new wallet');
    fireEvent.click(createButton);

    const createWithGoogleButton = getByTestId(
      'onboarding-create-with-google-button',
    );
    fireEvent.click(createWithGoogleButton);

    await waitFor(() => {
      expect(getByTestId('login-error-modal')).toBeInTheDocument();
    });
  });

  it('should track onboarding events when the user clicks on Social Login Create button', async () => {
    const { getByText, getByTestId } = renderWithProvider(
      <MetaMetricsContext.Provider value={mockTrackEvent}>
        <Welcome />
      </MetaMetricsContext.Provider>,
      mockStore,
    );

    const createButton = getByText('Create a new wallet');
    fireEvent.click(createButton);

    const createWithGoogleButton = getByTestId(
      'onboarding-create-with-google-button',
    );
    fireEvent.click(createWithGoogleButton);

    await waitFor(() => {
      expect(startOAuthLoginSpy).toHaveBeenCalled();

      expect(mockTrackEvent).toHaveBeenCalledTimes(2);

      // should track wallet import started
      expect(mockTrackEvent).toHaveBeenNthCalledWith(1, {
        category: MetaMetricsEventCategory.Onboarding,
        event: MetaMetricsEventName.WalletSetupStarted,
        properties: {
          account_type: `${MetaMetricsEventAccountType.Default}_google`,
        },
      });

      // should track wallet import completed
      expect(mockTrackEvent).toHaveBeenNthCalledWith(2, {
        category: MetaMetricsEventCategory.Onboarding,
        event: MetaMetricsEventName.SocialLoginCompleted,
        properties: {
          account_type: `${MetaMetricsEventAccountType.Default}_google`,
        },
      });

      // should set setParticipateInMetaMetrics to true and send the queued events to Segment
      expect(enabledMetricsSpy).toHaveBeenCalledWith(true);
    });
  });

  it('should track onboarding events when the user clicks on Social Login Import button', async () => {
    const { getByText, getByTestId } = renderWithProvider(
      <MetaMetricsContext.Provider value={mockTrackEvent}>
        <Welcome />
      </MetaMetricsContext.Provider>,
      mockStore,
    );

    const createButton = getByText('I have an existing wallet');
    fireEvent.click(createButton);

    const importWithGoogleButton = getByTestId(
      'onboarding-import-with-google-button',
    );
    fireEvent.click(importWithGoogleButton);

    await waitFor(() => {
      expect(startOAuthLoginSpy).toHaveBeenCalled();

      expect(mockTrackEvent).toHaveBeenCalledTimes(2);

      // should track wallet import started
      expect(mockTrackEvent).toHaveBeenNthCalledWith(1, {
        category: MetaMetricsEventCategory.Onboarding,
        event: MetaMetricsEventName.WalletImportStarted,
        properties: {
          account_type: `${MetaMetricsEventAccountType.Imported}_google`,
        },
      });

      // should track wallet import completed
      expect(mockTrackEvent).toHaveBeenNthCalledWith(2, {
        category: MetaMetricsEventCategory.Onboarding,
        event: MetaMetricsEventName.SocialLoginCompleted,
        properties: {
          account_type: `${MetaMetricsEventAccountType.Imported}_google`,
        },
      });

      // should set Metametrics optin status for social login import
      expect(enabledMetricsSpy).toHaveBeenCalledWith(true);
    });
  });

  it('should not set Metametrics optin status for social login in Firefox', async () => {
    const getBrowserNameSpy = jest
      .spyOn(BrowserRuntimeUtils, 'getBrowserName')
      .mockReturnValue(PLATFORM_FIREFOX);

    const { getByText, getByTestId } = renderWithProvider(
      <MetaMetricsContext.Provider value={mockTrackEvent}>
        <Welcome />
      </MetaMetricsContext.Provider>,
      mockStore,
    );

    const createButton = getByText('I have an existing wallet');
    fireEvent.click(createButton);

    const importWithGoogleButton = getByTestId(
      'onboarding-import-with-google-button',
    );
    fireEvent.click(importWithGoogleButton);

    await waitFor(() => {
      expect(startOAuthLoginSpy).toHaveBeenCalled();

      expect(mockTrackEvent).toHaveBeenCalledTimes(2);

      // should track wallet import started
      expect(mockTrackEvent).toHaveBeenNthCalledWith(1, {
        category: MetaMetricsEventCategory.Onboarding,
        event: MetaMetricsEventName.WalletImportStarted,
        properties: {
          account_type: `${MetaMetricsEventAccountType.Imported}_google`,
        },
      });

      // should track wallet import completed
      expect(mockTrackEvent).toHaveBeenNthCalledWith(2, {
        category: MetaMetricsEventCategory.Onboarding,
        event: MetaMetricsEventName.SocialLoginCompleted,
        properties: {
          account_type: `${MetaMetricsEventAccountType.Imported}_google`,
        },
      });

      expect(getBrowserNameSpy).toHaveBeenCalled();

      // should not set Metametrics optin status for social login in Firefox
      expect(enabledMetricsSpy).not.toHaveBeenCalledWith(true);
    });
  });

  it('should not set Metametrics optin status for SPR user', async () => {
    const { getByText, getByTestId } = renderWithProvider(
      <MetaMetricsContext.Provider value={mockTrackEvent}>
        <Welcome />
      </MetaMetricsContext.Provider>,
      mockStore,
    );

    const createButton = getByText('Create a new wallet');
    fireEvent.click(createButton);

    const createWithGoogleButton = getByTestId(
      'onboarding-create-with-srp-button',
    );
    fireEvent.click(createWithGoogleButton);

    await waitFor(() => {
      expect(mockTrackEvent).toHaveBeenCalledTimes(1);

      // should track wallet import started
      expect(mockTrackEvent).toHaveBeenNthCalledWith(1, {
        category: MetaMetricsEventCategory.Onboarding,
        event: MetaMetricsEventName.WalletSetupStarted,
        properties: {
          account_type: MetaMetricsEventAccountType.Default,
        },
      });

      // should not set Metametrics optin status for SPR user
      expect(enabledMetricsSpy).not.toHaveBeenCalledWith(true);

      // should navigate to create password page
      expect(mockUseNavigate).toHaveBeenCalledWith(
        ONBOARDING_CREATE_PASSWORD_ROUTE,
      );
    });
  });
});
