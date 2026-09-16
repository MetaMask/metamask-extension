import React from 'react';
import { fireEvent } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import mockState from '../../../../test/data/mock-state.json';
import {
  en as messages,
  renderWithProvider,
} from '../../../../test/lib/render-helpers-navigate';
import {
  ENVIRONMENT_TYPE_FULLSCREEN,
  ENVIRONMENT_TYPE_NOTIFICATION,
  ENVIRONMENT_TYPE_POPUP,
} from '../../../../shared/constants/app';
import { MetaMetricsEventName } from '../../../../shared/constants/metametrics';
import { PRIVACY_ROUTE } from '../../../helpers/constants/routes';
import { hideMigrationToast } from '../../../store/actions';
import { BasicFunctionalityMigrationToast } from './basic-functionality-migration-toast';
import {
  BASIC_FUNCTIONALITY_MIXED_TOAST_NOTICE_NAME,
  BasicFunctionalityMixedToastAction,
} from './constants';

const mockNavigate = jest.fn();
const mockGetEnvironmentType = jest.fn(() => ENVIRONMENT_TYPE_FULLSCREEN);
const mockOpenExtensionInBrowser = jest.fn();
const mockTrackEvent = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('../../../../shared/lib/environment-type', () => ({
  getEnvironmentType: () => mockGetEnvironmentType(),
}));

jest.mock('../../../hooks/useAnalytics', () => {
  const { createEventBuilder } = jest.requireActual(
    '../../../../shared/lib/analytics/create-event-builder',
  );

  return {
    useAnalytics: () => ({
      trackEvent: mockTrackEvent,
      createEventBuilder,
    }),
  };
});

jest.mock('../../../store/actions', () => ({
  ...jest.requireActual('../../../store/actions'),
  hideMigrationToast: jest.fn(() => jest.fn()),
}));

const mockStore = configureMockStore([thunk]);

function renderComponent({
  isBasicFunctionalityEnabled = true,
  notification = 'toast',
}: {
  isBasicFunctionalityEnabled?: boolean;
  notification?: 'modal' | 'toast' | null;
} = {}) {
  const store = mockStore({
    ...mockState,
    metamask: {
      ...mockState.metamask,
      useExternalServices: isBasicFunctionalityEnabled,
      remoteFeatureFlags: {
        ...mockState.metamask.remoteFeatureFlags,
        extensionBasicFunctionalityToggle: true,
      },
      preferences: {
        ...mockState.metamask.preferences,
        basicFunctionalityMigrationNotification: notification,
        basicFunctionalityMigrationNotificationDismissed: false,
      },
    },
  });

  return renderWithProvider(<BasicFunctionalityMigrationToast />, store);
}

describe('BasicFunctionalityMigrationToast', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetEnvironmentType.mockReturnValue(ENVIRONMENT_TYPE_FULLSCREEN);
    globalThis.platform = {
      openExtensionInBrowser: mockOpenExtensionInBrowser,
    } as never;
  });

  it('shows the enabled Basic Functionality state', () => {
    const { getByTestId } = renderComponent({
      isBasicFunctionalityEnabled: true,
    });

    expect(
      getByTestId('basic-functionality-migration-toast'),
    ).toHaveTextContent('this setting is enabled.');
  });

  it('shows the disabled Basic Functionality state', () => {
    const { getByTestId } = renderComponent({
      isBasicFunctionalityEnabled: false,
    });

    expect(
      getByTestId('basic-functionality-migration-toast'),
    ).toHaveTextContent('this setting is disabled.');
  });

  it('does not render when no toast is scheduled', () => {
    const { queryByTestId } = renderComponent({ notification: null });

    expect(
      queryByTestId('basic-functionality-migration-toast'),
    ).not.toBeInTheDocument();
  });

  it('tracks viewed when the toast is shown', () => {
    renderComponent();

    expect(mockTrackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        name: MetaMetricsEventName.NoticeUpdateDisplayed,
        properties: expect.objectContaining({
          name: BASIC_FUNCTIONALITY_MIXED_TOAST_NOTICE_NAME,
          action: BasicFunctionalityMixedToastAction.Viewed,
        }),
      }),
    );
  });

  it('dismisses and navigates to privacy settings in fullscreen', () => {
    const { getByTestId } = renderComponent();

    fireEvent.click(getByTestId('basic-functionality-migration-settings-link'));

    expect(hideMigrationToast).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith(PRIVACY_ROUTE);
    expect(mockOpenExtensionInBrowser).not.toHaveBeenCalled();
    expect(mockTrackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        name: MetaMetricsEventName.NoticeUpdateDisplayed,
        properties: expect.objectContaining({
          name: BASIC_FUNCTIONALITY_MIXED_TOAST_NOTICE_NAME,
          action: BasicFunctionalityMixedToastAction.OpenSettings,
        }),
      }),
    );
  });

  it('opens privacy settings in the full extension UI from notification', () => {
    mockGetEnvironmentType.mockReturnValue(ENVIRONMENT_TYPE_NOTIFICATION);
    const { getByTestId } = renderComponent();

    fireEvent.click(getByTestId('basic-functionality-migration-settings-link'));

    expect(hideMigrationToast).toHaveBeenCalled();
    expect(mockOpenExtensionInBrowser).toHaveBeenCalledWith(PRIVACY_ROUTE);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('opens privacy settings in the full extension UI from popup', () => {
    mockGetEnvironmentType.mockReturnValue(ENVIRONMENT_TYPE_POPUP);
    const { getByTestId } = renderComponent();

    fireEvent.click(getByTestId('basic-functionality-migration-settings-link'));

    expect(hideMigrationToast).toHaveBeenCalled();
    expect(mockOpenExtensionInBrowser).toHaveBeenCalledWith(PRIVACY_ROUTE);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('dismisses from the close button', () => {
    const { getByRole } = renderComponent();

    fireEvent.click(
      getByRole('button', {
        name: messages.close.message,
      }),
    );

    expect(hideMigrationToast).toHaveBeenCalled();
    expect(mockTrackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        name: MetaMetricsEventName.NoticeUpdateDisplayed,
        properties: expect.objectContaining({
          name: BASIC_FUNCTIONALITY_MIXED_TOAST_NOTICE_NAME,
          action: BasicFunctionalityMixedToastAction.Dismiss,
        }),
      }),
    );
  });
});
