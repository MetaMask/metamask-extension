import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { waitFor, fireEvent, act } from '@testing-library/react';
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

jest.mock('./fox-appear-animation', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __esModule: true,
  default: () => <div data-testid="fox-appear-animation" />,
}));

jest.mock('./metamask-wordmark-animation', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __esModule: true,
  default: ({
    setIsAnimationComplete,
  }: {
    setIsAnimationComplete: (isAnimationComplete: boolean) => void;
  }) => {
    // Simulate animation completion immediately using setTimeout
    setTimeout(() => setIsAnimationComplete(true), 0);
    return <div data-testid="metamask-wordmark-animation" />;
  },
}));

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
  let startOAuthLoginSpy: jest.SpyInstance;
  let enabledMetricsSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.resetAllMocks();
    startOAuthLoginSpy = jest
      .spyOn(Actions, 'startOAuthLogin')
      .mockReturnValueOnce(jest.fn().mockResolvedValueOnce(true));
    enabledMetricsSpy = jest.spyOn(Actions, 'setParticipateInMetaMetrics');
  });

  it('render matches snapshot', async () => {
    const { container } = renderWithProvider(<Welcome />, mockStore);
    await waitFor(() => {
      expect(container).toMatchSnapshot();
    });
  });

  it('render buttons', async () => {
    const { getByText } = renderWithProvider(<Welcome />, mockStore);
    await waitFor(() => {
      expect(getByText('Create a new wallet')).toBeInTheDocument();
      expect(getByText('I have an existing wallet')).toBeInTheDocument();
    });
  });

  it('should show the error modal when the error thrown in login', async () => {
    jest.resetAllMocks();
    jest
      .spyOn(Environment, 'getIsSeedlessOnboardingFeatureEnabled')
      .mockReturnValue(true);
    jest
      .spyOn(Actions, 'startOAuthLogin')
      .mockReturnValueOnce(jest.fn().mockRejectedValueOnce(new Error('test')));

    const { getByText, getByTestId } = renderWithProvider(
      <Welcome />,
      mockStore,
    );

    await waitFor(() => {
      expect(getByText('Create a new wallet')).toBeInTheDocument();
    });

    const createButton = getByText('Create a new wallet');

    await act(async () => {
      fireEvent.click(createButton);
      await new Promise((resolve) => setTimeout(resolve, 500));
    });

    await waitFor(() => {
      expect(
        getByTestId('onboarding-create-with-google-button'),
      ).toBeInTheDocument();
    });

    const createWithGoogleButton = getByTestId(
      'onboarding-create-with-google-button',
    );

    await act(async () => {
      fireEvent.click(createWithGoogleButton);
    });

    await waitFor(() => {
      expect(getByTestId('login-error-modal')).toBeInTheDocument();
    });
  });

  it('should track onboarding events when the user clicks on Social Login Create button', async () => {
    jest
      .spyOn(Environment, 'getIsSeedlessOnboardingFeatureEnabled')
      .mockReturnValue(true);
    const { getByText, getByTestId } = renderWithProvider(
      <MetaMetricsContext.Provider value={mockTrackEvent}>
        <Welcome />
      </MetaMetricsContext.Provider>,
      mockStore,
    );

    await waitFor(() => {
      expect(getByText('Create a new wallet')).toBeInTheDocument();
    });

    const createButton = getByText('Create a new wallet');

    await act(async () => {
      fireEvent.click(createButton);
      await new Promise((resolve) => setTimeout(resolve, 500));
    });

    await waitFor(() => {
      expect(
        getByTestId('onboarding-create-with-google-button'),
      ).toBeInTheDocument();
    });

    const createWithGoogleButton = getByTestId(
      'onboarding-create-with-google-button',
    );

    await act(async () => {
      fireEvent.click(createWithGoogleButton);
    });

    await waitFor(() => {
      expect(startOAuthLoginSpy).toHaveBeenCalled();

      expect(mockTrackEvent).toHaveBeenCalledTimes(2);

      // should track wallet import started
      expect(mockTrackEvent).toHaveBeenNthCalledWith(1, {
        category: MetaMetricsEventCategory.Onboarding,
        event: MetaMetricsEventName.WalletSetupStarted,
        properties: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          account_type: `${MetaMetricsEventAccountType.Default}_google`,
        },
      });

      // should track wallet import completed
      expect(mockTrackEvent).toHaveBeenNthCalledWith(2, {
        category: MetaMetricsEventCategory.Onboarding,
        event: MetaMetricsEventName.SocialLoginCompleted,
        properties: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          account_type: `${MetaMetricsEventAccountType.Default}_google`,
        },
      });

      // should set setParticipateInMetaMetrics to true and send the queued events to Segment
      expect(enabledMetricsSpy).toHaveBeenCalledWith(true);
    });
  });

  it('should track onboarding events when the user clicks on Social Login Import button', async () => {
    jest
      .spyOn(Environment, 'getIsSeedlessOnboardingFeatureEnabled')
      .mockReturnValue(true);
    const { getByText, getByTestId } = renderWithProvider(
      <MetaMetricsContext.Provider value={mockTrackEvent}>
        <Welcome />
      </MetaMetricsContext.Provider>,
      mockStore,
    );

    await waitFor(() => {
      expect(getByText('I have an existing wallet')).toBeInTheDocument();
    });

    const createButton = getByText('I have an existing wallet');

    await act(async () => {
      fireEvent.click(createButton);
      await new Promise((resolve) => setTimeout(resolve, 500));
    });

    await waitFor(() => {
      expect(
        getByTestId('onboarding-import-with-google-button'),
      ).toBeInTheDocument();
    });

    const importWithGoogleButton = getByTestId(
      'onboarding-import-with-google-button',
    );

    await act(async () => {
      fireEvent.click(importWithGoogleButton);
    });

    await waitFor(() => {
      expect(startOAuthLoginSpy).toHaveBeenCalled();

      expect(mockTrackEvent).toHaveBeenCalledTimes(2);

      // should track wallet import started
      expect(mockTrackEvent).toHaveBeenNthCalledWith(1, {
        category: MetaMetricsEventCategory.Onboarding,
        event: MetaMetricsEventName.WalletImportStarted,
        properties: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          account_type: `${MetaMetricsEventAccountType.Imported}_google`,
        },
      });

      // should track wallet import completed
      expect(mockTrackEvent).toHaveBeenNthCalledWith(2, {
        category: MetaMetricsEventCategory.Onboarding,
        event: MetaMetricsEventName.SocialLoginCompleted,
        properties: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          account_type: `${MetaMetricsEventAccountType.Imported}_google`,
        },
      });

      // should set Metametrics optin status for social login import
      expect(enabledMetricsSpy).toHaveBeenCalledWith(true);
    });
  });

  it('should not set Metametrics optin status for social login in Firefox', async () => {
    jest
      .spyOn(Environment, 'getIsSeedlessOnboardingFeatureEnabled')
      .mockReturnValue(true);
    const getBrowserNameSpy = jest
      .spyOn(BrowserRuntimeUtils, 'getBrowserName')
      .mockReturnValue(PLATFORM_FIREFOX);

    const { getByText, getByTestId } = renderWithProvider(
      <MetaMetricsContext.Provider value={mockTrackEvent}>
        <Welcome />
      </MetaMetricsContext.Provider>,
      mockStore,
    );

    await waitFor(() => {
      expect(getByText('I have an existing wallet')).toBeInTheDocument();
    });

    const createButton = getByText('I have an existing wallet');

    await act(async () => {
      fireEvent.click(createButton);
      await new Promise((resolve) => setTimeout(resolve, 500));
    });

    await waitFor(() => {
      expect(
        getByTestId('onboarding-import-with-google-button'),
      ).toBeInTheDocument();
    });

    const importWithGoogleButton = getByTestId(
      'onboarding-import-with-google-button',
    );

    await act(async () => {
      fireEvent.click(importWithGoogleButton);
    });

    await waitFor(() => {
      expect(startOAuthLoginSpy).toHaveBeenCalled();

      expect(mockTrackEvent).toHaveBeenCalledTimes(2);

      // should track wallet import started
      expect(mockTrackEvent).toHaveBeenNthCalledWith(1, {
        category: MetaMetricsEventCategory.Onboarding,
        event: MetaMetricsEventName.WalletImportStarted,
        properties: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          account_type: `${MetaMetricsEventAccountType.Imported}_google`,
        },
      });

      // should track wallet import completed
      expect(mockTrackEvent).toHaveBeenNthCalledWith(2, {
        category: MetaMetricsEventCategory.Onboarding,
        event: MetaMetricsEventName.SocialLoginCompleted,
        properties: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          account_type: `${MetaMetricsEventAccountType.Imported}_google`,
        },
      });

      expect(getBrowserNameSpy).toHaveBeenCalled();

      // should not set Metametrics optin status for social login in Firefox
      expect(enabledMetricsSpy).not.toHaveBeenCalledWith(true);
    });
  });

  it('should not set Metametrics optin status for SPR user', async () => {
    jest
      .spyOn(Environment, 'getIsSeedlessOnboardingFeatureEnabled')
      .mockReturnValue(true);
    const { getByText, getByTestId } = renderWithProvider(
      <MetaMetricsContext.Provider value={mockTrackEvent}>
        <Welcome />
      </MetaMetricsContext.Provider>,
      mockStore,
    );

    await waitFor(() => {
      expect(getByText('Create a new wallet')).toBeInTheDocument();
    });

    const createButton = getByText('Create a new wallet');

    await act(async () => {
      fireEvent.click(createButton);
      await new Promise((resolve) => setTimeout(resolve, 500));
    });

    await waitFor(() => {
      expect(
        getByTestId('onboarding-create-with-srp-button'),
      ).toBeInTheDocument();
    });

    const createWithGoogleButton = getByTestId(
      'onboarding-create-with-srp-button',
    );

    await act(async () => {
      fireEvent.click(createWithGoogleButton);
    });

    await waitFor(() => {
      expect(mockTrackEvent).toHaveBeenCalledTimes(1);

      // should track wallet import started
      expect(mockTrackEvent).toHaveBeenNthCalledWith(1, {
        category: MetaMetricsEventCategory.Onboarding,
        event: MetaMetricsEventName.WalletSetupStarted,
        properties: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
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
